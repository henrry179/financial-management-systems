import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { accountService } from '../services/accountService';
import { Decimal } from '@prisma/client/runtime/library';

export class AccountController {
  private getAuthenticatedUserId(req: AuthRequest, res: Response): string | null {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
      return null;
    }
    return userId;
  }

  async getAccounts(req: AuthRequest, res: Response) {
    try {
      const userId = this.getAuthenticatedUserId(req, res);
      if (!userId) return;
      
      const { baseCurrency = 'CNY' } = req.query;
      
      // 获取账户列表及实时余额汇总（支持多币种）
      const accountsSummary = await accountService.getUserAccountsSummary(userId, baseCurrency as string);

      res.json({
        success: true,
        data: accountsSummary,
        message: 'Accounts retrieved with real-time balance calculation and multi-currency support'
      });
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ACCOUNTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch accounts',
        },
      });
    }
  }

  async createAccount(req: AuthRequest, res: Response) {
    try {
      const userId = this.getAuthenticatedUserId(req, res);
      if (!userId) return;
      const { name, type, balance, currency, description, bankName, accountNumber } = req.body;

      // 使用新的货币验证服务创建账户
      const account = await accountService.createAccountWithCurrencyValidation({
        userId,
        name,
        type,
        balance: balance ? new Decimal(balance) : undefined,
        currency: currency || 'CNY',
        description,
        bankName,
        accountNumber
      });

      res.status(201).json({
        success: true,
        data: account,
        message: 'Account created successfully with currency validation'
      });
    } catch (error) {
      console.error('Error creating account:', error);
      
      if (error.message.includes('Unsupported currency')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CURRENCY',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_ACCOUNT_ERROR',
          message: 'Failed to create account',
        },
      });
    }
  }

  async updateAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { name, type, balance, currency, description } = req.body;

      const account = await prisma.account.update({
        where: { id: id, userId },
        data: {
          name,
          type,
          balance: parseFloat(balance),
          currency,
          description,
        },
      });

      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ACCOUNT_ERROR',
          message: 'Failed to update account',
        },
      });
    }
  }

  async deleteAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { forceDelete = false } = req.body;

      // 验证账户是否属于用户
      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      // 使用安全删除机制
      const deletedAccount = await accountService.safeDeleteAccount(id, forceDelete);

      res.json({
        success: true,
        data: deletedAccount,
        message: `Account ${forceDelete ? 'force ' : ''}deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      
      if (error.message.includes('Cannot delete account')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ACCOUNT_PROTECTED',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ACCOUNT_ERROR',
          message: 'Failed to delete account',
        },
      });
    }
  }

  async getAccountById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      console.error('Error fetching account:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ACCOUNT_ERROR',
          message: 'Failed to fetch account',
        },
      });
    }
  }

  async updateBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { balance } = req.body;

      const account = await prisma.account.update({
        where: { id: id, userId },
        data: {
          balance: parseFloat(balance),
        },
      });

      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      console.error('Error updating balance:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_BALANCE_ERROR',
          message: 'Failed to update balance',
        },
      });
    }
  }

  async getAccountTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      // 验证账户是否属于用户
      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      const transactions = await prisma.transaction.findMany({
        where: { 
          OR: [
            { fromAccountId: id },
            { toAccountId: id }
          ]
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_TRANSACTIONS_ERROR',
          message: 'Failed to fetch transactions',
        },
      });
    }
  }

  async getAccountStatistics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      // 验证账户是否属于用户
      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      // 使用新的账户服务获取详细余额信息
      const balanceDetails = await accountService.getAccountBalanceDetails(id);

      res.json({
        success: true,
        data: balanceDetails,
        message: 'Account statistics with real-time balance calculation'
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_STATISTICS_ERROR',
          message: 'Failed to fetch statistics',
        },
      });
    }
  }

  async syncAccountBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      // 验证账户是否属于用户
      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      // 同步账户余额
      await accountService.syncAccountBalance(id);
      
      // 获取更新后的余额详情
      const balanceDetails = await accountService.getAccountBalanceDetails(id);

      res.json({
        success: true,
        data: balanceDetails,
        message: 'Account balance synchronized successfully'
      });
    } catch (error) {
      console.error('Error syncing account balance:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SYNC_BALANCE_ERROR',
          message: 'Failed to sync account balance',
        },
      });
    }
  }

  async syncAllAccountBalances(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      // 同步用户所有账户余额
      await accountService.syncAllAccountBalances(userId);
      
      // 获取更新后的账户汇总
      const accountsSummary = await accountService.getUserAccountsSummary(userId);

      res.json({
        success: true,
        data: accountsSummary,
        message: 'All account balances synchronized successfully'
      });
    } catch (error) {
      console.error('Error syncing all account balances:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SYNC_ALL_BALANCES_ERROR',
          message: 'Failed to sync all account balances',
        },
      });
    }
  }

  async validateAccountBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      // 验证账户是否属于用户
      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      // 验证账户余额一致性
      const isValid = await accountService.validateAccountBalance(id);
      const balanceDetails = await accountService.getAccountBalanceDetails(id);

      res.json({
        success: true,
        data: {
          isValid,
          balanceDetails,
          recommendation: isValid ? 'Balance is consistent' : 'Balance needs synchronization'
        },
        message: 'Account balance validation completed'
      });
    } catch (error) {
      console.error('Error validating account balance:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATE_BALANCE_ERROR',
          message: 'Failed to validate account balance',
        },
      });
    }
  }

  async getAccountMultiCurrencyStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { targetCurrencies } = req.query;

      // 验证账户是否属于用户
      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      // 解析目标货币
      const currencies = targetCurrencies 
        ? (targetCurrencies as string).split(',')
        : ['CNY', 'USD', 'EUR'];

      const stats = await accountService.getAccountMultiCurrencyStats(id, currencies);

      res.json({
        success: true,
        data: stats,
        message: 'Account multi-currency statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching account multi-currency stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_MULTI_CURRENCY_STATS_ERROR',
          message: 'Failed to fetch account multi-currency statistics',
        },
      });
    }
  }

  async updateAccountStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { isActive, reason } = req.body;

      // 验证账户是否属于用户
      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      const updatedAccount = await accountService.updateAccountStatus(id, isActive, reason);

      res.json({
        success: true,
        data: updatedAccount,
        message: `Account ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error updating account status:', error);
      
      if (error.message.includes('Cannot deactivate account')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ACCOUNT_HAS_ACTIVE_TRANSACTIONS',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ACCOUNT_STATUS_ERROR',
          message: 'Failed to update account status',
        },
      });
    }
  }

  async batchUpdateAccountStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { accountIds, isActive, reason } = req.body;

      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACCOUNT_IDS',
            message: 'accountIds must be a non-empty array',
          },
        });
      }

      // 验证所有账户都属于用户
      const userAccounts = await prisma.account.findMany({
        where: { 
          id: { in: accountIds },
          userId 
        },
        select: { id: true }
      });

      if (userAccounts.length !== accountIds.length) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SOME_ACCOUNTS_NOT_FOUND',
            message: 'One or more accounts not found or do not belong to user',
          },
        });
      }

      const result = await accountService.batchUpdateAccountStatus(accountIds, isActive, reason);

      res.json({
        success: true,
        data: result,
        message: `Batch ${isActive ? 'activation' : 'deactivation'} completed`
      });
    } catch (error) {
      console.error('Error batch updating account status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BATCH_UPDATE_STATUS_ERROR',
          message: 'Failed to batch update account status',
        },
      });
    }
  }

  async getAccountStatusHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      // 验证账户是否属于用户
      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      const history = await accountService.getAccountStatusHistory(id);

      res.json({
        success: true,
        data: {
          accountId: id,
          accountName: account.name,
          currentStatus: account.isActive,
          history
        },
        message: 'Account status history retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching account status history:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_STATUS_HISTORY_ERROR',
          message: 'Failed to fetch account status history',
        },
      });
    }
  }

  async getUserAccountStatusStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const stats = await accountService.getUserAccountStatusStats(userId);

      res.json({
        success: true,
        data: stats,
        message: 'User account status statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching user account status stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_STATUS_STATS_ERROR',
          message: 'Failed to fetch user account status statistics',
        },
      });
    }
  }

  async autoDeactivateInactiveAccounts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { inactiveDays = 365, dryRun = false } = req.body;

      if (inactiveDays < 30 || inactiveDays > 3650) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INACTIVE_DAYS',
            message: 'inactiveDays must be between 30 and 3650 days',
          },
        });
      }

      if (dryRun) {
        // 仅模拟运行，不实际禁用账户
        // 实现模拟运行逻辑
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

        // 查找将要被禁用的账户（模拟）
        const inactiveAccounts = await prisma.account.findMany({
          where: {
            userId,
            isActive: true,
            updatedAt: {
              lt: cutoffDate
            }
          },
          include: {
            fromTransactions: {
              where: {
                date: {
                  gte: cutoffDate
                }
              },
              take: 1
            },
            toTransactions: {
              where: {
                date: {
                  gte: cutoffDate
                }
              },
              take: 1
            }
          }
        });

        // 过滤出真正没有交易的账户
        const accountsToDeactivate = inactiveAccounts.filter(account => 
          account.fromTransactions.length === 0 && account.toTransactions.length === 0
        );

        return res.json({
          success: true,
          data: {
            dryRun: true,
            inactiveAccountCount: inactiveAccounts.length,
            accountsToDeactivateCount: accountsToDeactivate.length,
            accountsToDeactivate: accountsToDeactivate.map(account => ({
              id: account.id,
              name: account.name,
              lastUpdated: account.updatedAt
            })),
            message: `Dry run completed - ${accountsToDeactivate.length} accounts would be deactivated`
          },
          message: 'Auto-deactivation dry run completed'
        });
      }

      const result = await accountService.autoDeactivateInactiveAccounts(userId, inactiveDays);

      res.json({
        success: true,
        data: result,
        message: 'Auto-deactivation of inactive accounts completed'
      });
    } catch (error) {
      console.error('Error auto-deactivating inactive accounts:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTO_DEACTIVATE_ERROR',
          message: 'Failed to auto-deactivate inactive accounts',
        },
      });
    }
  }

  async getAccountStatusValidationReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const report = await accountService.getAccountStatusValidationReport(userId);

      res.json({
        success: true,
        data: report,
        message: 'Account status validation report generated successfully'
      });
    } catch (error) {
      console.error('Error generating account status validation report:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GENERATE_VALIDATION_REPORT_ERROR',
          message: 'Failed to generate account status validation report',
        },
      });
    }
  }

  async checkAccountDeletionProtection(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      // 验证账户是否属于用户
      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      const protectionCheck = await accountService.checkAccountDeletionProtection(id);

      res.json({
        success: true,
        data: {
          accountId: id,
          accountName: account.name,
          ...protectionCheck
        },
        message: 'Account deletion protection check completed'
      });
    } catch (error) {
      console.error('Error checking account deletion protection:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CHECK_DELETION_PROTECTION_ERROR',
          message: 'Failed to check account deletion protection',
        },
      });
    }
  }

  async batchSafeDeleteAccounts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { accountIds, forceDelete = false } = req.body;

      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACCOUNT_IDS',
            message: 'accountIds must be a non-empty array',
          },
        });
      }

      // 验证所有账户都属于用户
      const userAccounts = await prisma.account.findMany({
        where: { 
          id: { in: accountIds },
          userId 
        },
        select: { id: true }
      });

      if (userAccounts.length !== accountIds.length) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SOME_ACCOUNTS_NOT_FOUND',
            message: 'One or more accounts not found or do not belong to user',
          },
        });
      }

      const result = await accountService.batchSafeDeleteAccounts(accountIds, forceDelete);

      res.json({
        success: true,
        data: result,
        message: `Batch deletion ${forceDelete ? '(force) ' : ''}completed`
      });
    } catch (error) {
      console.error('Error batch deleting accounts:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BATCH_DELETE_ERROR',
          message: 'Failed to batch delete accounts',
        },
      });
    }
  }

  async restoreDeletedAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { reason } = req.body;

      // 验证账户是否属于用户
      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      const restoredAccount = await accountService.restoreDeletedAccount(id, reason);

      res.json({
        success: true,
        data: restoredAccount,
        message: 'Account restored successfully'
      });
    } catch (error) {
      console.error('Error restoring account:', error);
      
      if (error.message.includes('Account is not deleted')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_DELETED',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'RESTORE_ACCOUNT_ERROR',
          message: 'Failed to restore account',
        },
      });
    }
  }

  async getDeletedAccounts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const deletedAccounts = await accountService.getDeletedAccounts(userId);

      res.json({
        success: true,
        data: {
          accounts: deletedAccounts,
          count: deletedAccounts.length
        },
        message: 'Deleted accounts retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching deleted accounts:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_DELETED_ACCOUNTS_ERROR',
          message: 'Failed to fetch deleted accounts',
        },
      });
    }
  }

  async permanentDeleteAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      // 验证账户是否属于用户
      const account = await prisma.account.findFirst({
        where: { id: id, userId },
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found',
          },
        });
      }

      const result = await accountService.permanentDeleteAccount(id);

      res.json({
        success: true,
        data: result,
        message: 'Account permanently deleted successfully'
      });
    } catch (error) {
      console.error('Error permanently deleting account:', error);
      
      if (error.message.includes('Cannot permanently delete')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PERMANENT_DELETE_BLOCKED',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'PERMANENT_DELETE_ERROR',
          message: 'Failed to permanently delete account',
        },
      });
    }
  }

  async getAccountDeletionHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const history = await accountService.getAccountDeletionHistory(userId);

      res.json({
        success: true,
        data: {
          history,
          count: history.length
        },
        message: 'Account deletion history retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching account deletion history:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_DELETION_HISTORY_ERROR',
          message: 'Failed to fetch account deletion history',
        },
      });
    }
  }

  async getAccountDeletionProtectionReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const report = await accountService.getAccountDeletionProtectionReport(userId);

      res.json({
        success: true,
        data: report,
        message: 'Account deletion protection report generated successfully'
      });
    } catch (error) {
      console.error('Error generating account deletion protection report:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GENERATE_DELETION_PROTECTION_REPORT_ERROR',
          message: 'Failed to generate account deletion protection report',
        },
      });
    }
  }
} 