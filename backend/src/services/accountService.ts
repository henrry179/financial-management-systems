import { prisma } from '../index';
import { Decimal } from '@prisma/client/runtime/library';
import { currencyService } from './currencyService';

export class AccountService {
  /**
   * 计算账户的实时余额
   * 基于交易记录计算账户的当前余额
   */
  async calculateRealTimeBalance(accountId: string): Promise<Decimal> {
    try {
      // 获取账户初始余额
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { balance: true }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // 计算所有收入交易总额（转入账户的钱）
      const incomeResult = await prisma.transaction.aggregate({
        where: {
          toAccountId: accountId,
          type: { in: ['INCOME', 'TRANSFER_IN'] }
        },
        _sum: {
          amount: true
        }
      });

      // 计算所有支出交易总额（从账户转出的钱）
      const expenseResult = await prisma.transaction.aggregate({
        where: {
          fromAccountId: accountId,
          type: { in: ['EXPENSE', 'TRANSFER_OUT'] }
        },
        _sum: {
          amount: true
        }
      });

      const totalIncome = incomeResult._sum.amount || new Decimal(0);
      const totalExpense = expenseResult._sum.amount || new Decimal(0);
      
      // 实时余额 = 初始余额 + 收入 - 支出
      const realTimeBalance = account.balance.add(totalIncome).sub(totalExpense);
      
      return realTimeBalance;
    } catch (error) {
      console.error('Error calculating real-time balance:', error);
      throw error;
    }
  }

  /**
   * 同步账户余额
   * 将数据库中的余额更新为实时计算的余额
   */
  async syncAccountBalance(accountId: string): Promise<void> {
    try {
      const realTimeBalance = await this.calculateRealTimeBalance(accountId);
      
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: realTimeBalance }
      });
    } catch (error) {
      console.error('Error syncing account balance:', error);
      throw error;
    }
  }

  /**
   * 批量同步所有账户余额
   */
  async syncAllAccountBalances(userId: string): Promise<void> {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId },
        select: { id: true }
      });

      // 并发同步所有账户余额
      await Promise.all(
        accounts.map(account => this.syncAccountBalance(account.id))
      );
    } catch (error) {
      console.error('Error syncing all account balances:', error);
      throw error;
    }
  }

  /**
   * 获取账户详细余额信息
   */
  async getAccountBalanceDetails(accountId: string) {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      const realTimeBalance = await this.calculateRealTimeBalance(accountId);
      
      // 获取本月收支统计
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const [monthlyIncome, monthlyExpense] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            toAccountId: accountId,
            type: { in: ['INCOME', 'TRANSFER_IN'] },
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: {
            fromAccountId: accountId,
            type: { in: ['EXPENSE', 'TRANSFER_OUT'] },
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true }
        })
      ]);

      return {
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        currency: account.currency,
        storedBalance: account.balance,
        realTimeBalance: realTimeBalance,
        balanceDifference: realTimeBalance.sub(account.balance),
        monthlyIncome: monthlyIncome._sum.amount || new Decimal(0),
        monthlyExpense: monthlyExpense._sum.amount || new Decimal(0),
        monthlyNetChange: (monthlyIncome._sum.amount || new Decimal(0)).sub(monthlyExpense._sum.amount || new Decimal(0)),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting account balance details:', error);
      throw error;
    }
  }

  /**
   * 验证账户余额一致性
   */
  async validateAccountBalance(accountId: string): Promise<boolean> {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        return false;
      }

      const realTimeBalance = await this.calculateRealTimeBalance(accountId);
      const difference = realTimeBalance.sub(account.balance).abs();
      
      // 如果差异小于0.01，认为余额一致
      return difference.lt(new Decimal(0.01));
    } catch (error) {
      console.error('Error validating account balance:', error);
      return false;
    }
  }

  /**
   * 获取用户所有账户的余额汇总
   */
  async getUserAccountsSummary(userId: string, baseCurrency: string = 'CNY') {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          currency: true,
          isActive: true,
          bankName: true,
          accountNumber: true,
          createdAt: true
        }
      });

      const accountsWithRealTimeBalance = await Promise.all(
        accounts.map(async (account) => {
          const realTimeBalance = await this.calculateRealTimeBalance(account.id);
          
          // 转换到基准货币
          let convertedBalance = realTimeBalance;
          let exchangeRate = new Decimal(1);
          
          if (account.currency !== baseCurrency) {
            try {
              const conversion = await currencyService.convertAmount(
                realTimeBalance,
                account.currency,
                baseCurrency
              );
              convertedBalance = conversion.convertedAmount;
              exchangeRate = conversion.exchangeRate;
            } catch (error) {
              console.warn(`Failed to convert ${account.currency} to ${baseCurrency}:`, error);
            }
          }

          return {
            ...account,
            realTimeBalance,
            balanceDifference: realTimeBalance.sub(account.balance),
            convertedBalance,
            exchangeRate,
            baseCurrency,
            formattedBalance: currencyService.formatAmount(realTimeBalance, account.currency),
            formattedConverted: currencyService.formatAmount(convertedBalance, baseCurrency)
          };
        })
      );

      // 按币种分组汇总
      const summaryByCurrency = accountsWithRealTimeBalance.reduce((acc, account) => {
        if (!acc[account.currency]) {
          acc[account.currency] = {
            currency: account.currency,
            totalStoredBalance: new Decimal(0),
            totalRealTimeBalance: new Decimal(0),
            totalConvertedBalance: new Decimal(0),
            accountCount: 0,
            activeAccountCount: 0,
            currencySymbol: currencyService.getSupportedCurrencies().find(c => c.code === account.currency)?.symbol || account.currency
          };
        }
        
        acc[account.currency].totalStoredBalance = acc[account.currency].totalStoredBalance.add(account.balance);
        acc[account.currency].totalRealTimeBalance = acc[account.currency].totalRealTimeBalance.add(account.realTimeBalance);
        acc[account.currency].totalConvertedBalance = acc[account.currency].totalConvertedBalance.add(account.convertedBalance);
        acc[account.currency].accountCount++;
        
        if (account.isActive) {
          acc[account.currency].activeAccountCount++;
        }
        
        return acc;
      }, {} as Record<string, any>);

      // 计算所有货币的总计（以基准货币计算）
      const totalConvertedBalance = accountsWithRealTimeBalance
        .filter(a => a.isActive)
        .reduce((sum, account) => sum.add(account.convertedBalance), new Decimal(0));

      // 格式化汇总数据
      const formattedSummary = Object.values(summaryByCurrency).map((curr: any) => ({
        ...curr,
        totalStoredBalance: curr.totalStoredBalance.toString(),
        totalRealTimeBalance: curr.totalRealTimeBalance.toString(),
        totalConvertedBalance: curr.totalConvertedBalance.toString(),
        formattedTotal: currencyService.formatAmount(curr.totalRealTimeBalance, curr.currency),
        formattedConverted: currencyService.formatAmount(curr.totalConvertedBalance, baseCurrency)
      }));

      return {
        accounts: accountsWithRealTimeBalance.map(acc => ({
          ...acc,
          balance: acc.balance.toString(),
          realTimeBalance: acc.realTimeBalance.toString(),
          balanceDifference: acc.balanceDifference.toString(),
          convertedBalance: acc.convertedBalance.toString(),
          exchangeRate: acc.exchangeRate.toString()
        })),
        summary: formattedSummary,
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter(a => a.isActive).length,
        baseCurrency,
        totalConvertedBalance: totalConvertedBalance.toString(),
        formattedTotal: currencyService.formatAmount(totalConvertedBalance, baseCurrency),
        supportedCurrencies: currencyService.getSupportedCurrencies(),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting user accounts summary:', error);
      throw error;
    }
  }

  /**
   * 创建账户时验证货币代码
   */
  async createAccountWithCurrencyValidation(accountData: {
    userId: string;
    name: string;
    type: string;
    balance?: Decimal;
    currency?: string;
    description?: string;
    bankName?: string;
    accountNumber?: string;
  }) {
    try {
      const { currency = 'CNY', ...otherData } = accountData;

      // 验证货币代码
      if (!currencyService.isValidCurrency(currency)) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      // 创建账户
      const account = await prisma.account.create({
        data: {
          ...otherData,
          currency,
          balance: accountData.balance || new Decimal(0)
        }
      });

      return {
        ...account,
        balance: account.balance.toString(),
        formattedBalance: currencyService.formatAmount(account.balance, currency),
        currencyInfo: currencyService.getSupportedCurrencies().find(c => c.code === currency)
      };
    } catch (error) {
      console.error('Error creating account with currency validation:', error);
      throw error;
    }
  }

  /**
   * 获取账户的多币种统计
   */
  async getAccountMultiCurrencyStats(accountId: string, targetCurrencies: string[] = ['CNY', 'USD', 'EUR']) {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      const realTimeBalance = await this.calculateRealTimeBalance(accountId);
      const balanceDetails = await this.getAccountBalanceDetails(accountId);

      // 转换到多种目标货币
      const conversions = await Promise.all(
        targetCurrencies.map(async (targetCurrency) => {
          if (account.currency === targetCurrency) {
            return {
              currency: targetCurrency,
              amount: realTimeBalance,
              exchangeRate: new Decimal(1),
              formatted: currencyService.formatAmount(realTimeBalance, targetCurrency)
            };
          }

          try {
            const conversion = await currencyService.convertAmount(
              realTimeBalance,
              account.currency,
              targetCurrency
            );
            
            return {
              currency: targetCurrency,
              amount: conversion.convertedAmount,
              exchangeRate: conversion.exchangeRate,
              formatted: currencyService.formatAmount(conversion.convertedAmount, targetCurrency)
            };
          } catch (error) {
            console.warn(`Failed to convert to ${targetCurrency}:`, error);
            return null;
          }
        })
      );

      return {
        account: {
          ...account,
          balance: account.balance.toString(),
          formattedBalance: currencyService.formatAmount(account.balance, account.currency)
        },
        realTimeBalance: realTimeBalance.toString(),
        balanceDetails,
        conversions: conversions.filter(c => c !== null).map(c => ({
          ...c,
          amount: c!.amount.toString(),
          exchangeRate: c!.exchangeRate.toString()
        })),
        supportedCurrencies: currencyService.getSupportedCurrencies()
      };
    } catch (error) {
      console.error('Error getting account multi-currency stats:', error);
      throw error;
    }
  }

  /**
   * 更新账户状态
   */
  async updateAccountStatus(accountId: string, isActive: boolean, reason?: string) {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // 如果要禁用账户，检查是否有未完成的交易
      if (!isActive && account.isActive) {
        const hasActiveTransactions = await this.hasActiveTransactions(accountId);
        if (hasActiveTransactions) {
          throw new Error('Cannot deactivate account with active transactions');
        }

        // 检查账户余额是否为零（可选）
        const realTimeBalance = await this.calculateRealTimeBalance(accountId);
        if (!realTimeBalance.equals(0)) {
          console.warn(`Deactivating account with non-zero balance: ${realTimeBalance.toString()}`);
        }
      }

      // 更新账户状态
      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: { 
          isActive,
          updatedAt: new Date()
        }
      });

      // 记录状态变更历史
      await this.recordStatusChange(accountId, account.isActive, isActive, reason);

      return {
        ...updatedAccount,
        balance: updatedAccount.balance.toString(),
        formattedBalance: currencyService.formatAmount(updatedAccount.balance, updatedAccount.currency),
        statusChanged: account.isActive !== isActive,
        previousStatus: account.isActive,
        newStatus: isActive
      };
    } catch (error) {
      console.error('Error updating account status:', error);
      throw error;
    }
  }

  /**
   * 批量更新账户状态
   */
  async batchUpdateAccountStatus(
    accountIds: string[], 
    isActive: boolean, 
    reason?: string
  ) {
    try {
      const results = await Promise.allSettled(
        accountIds.map(accountId => 
          this.updateAccountStatus(accountId, isActive, reason)
        )
      );

      const successful: any[] = [];
      const failed: Array<{accountId: string, error: string}> = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push({
            accountId: accountIds[index],
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      return {
        successful,
        failed,
        totalRequested: accountIds.length,
        successCount: successful.length,
        failCount: failed.length
      };
    } catch (error) {
      console.error('Error batch updating account status:', error);
      throw error;
    }
  }

  /**
   * 获取账户状态历史
   */
  async getAccountStatusHistory(accountId: string) {
    try {
      // 从系统配置表获取状态历史（实际项目中应该创建专门的状态历史表）
      const historyKey = `account_status_history_${accountId}`;
      const config = await prisma.systemConfig.findUnique({
        where: { key: historyKey }
      });

      if (!config) {
        return [];
      }

      const history = JSON.parse(config.value);
      return history.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }));
    } catch (error) {
      console.error('Error getting account status history:', error);
      return [];
    }
  }

  /**
   * 获取用户的账户状态统计
   */
  async getUserAccountStatusStats(userId: string) {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
          currency: true,
          balance: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const stats = {
        total: accounts.length,
        active: accounts.filter(a => a.isActive).length,
        inactive: accounts.filter(a => !a.isActive).length,
        byType: {} as Record<string, {total: number, active: number, inactive: number}>,
        byCurrency: {} as Record<string, {total: number, active: number, inactive: number}>,
        recentlyCreated: accounts.filter(a => {
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 7);
          return a.createdAt > dayAgo;
        }).length,
        recentlyUpdated: accounts.filter(a => {
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 7);
          return a.updatedAt > dayAgo;
        }).length
      };

      // 按类型统计
      accounts.forEach(account => {
        if (!stats.byType[account.type]) {
          stats.byType[account.type] = { total: 0, active: 0, inactive: 0 };
        }
        stats.byType[account.type].total++;
        if (account.isActive) {
          stats.byType[account.type].active++;
        } else {
          stats.byType[account.type].inactive++;
        }
      });

      // 按货币统计
      accounts.forEach(account => {
        if (!stats.byCurrency[account.currency]) {
          stats.byCurrency[account.currency] = { total: 0, active: 0, inactive: 0 };
        }
        stats.byCurrency[account.currency].total++;
        if (account.isActive) {
          stats.byCurrency[account.currency].active++;
        } else {
          stats.byCurrency[account.currency].inactive++;
        }
      });

      return {
        ...stats,
        accounts: accounts.map(acc => ({
          ...acc,
          balance: acc.balance.toString(),
          formattedBalance: currencyService.formatAmount(acc.balance, acc.currency)
        }))
      };
    } catch (error) {
      console.error('Error getting user account status stats:', error);
      throw error;
    }
  }

  /**
   * 自动禁用长期未使用的账户
   */
  async autoDeactivateInactiveAccounts(userId: string, inactiveDays: number = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

      // 查找长期未使用的账户
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

      if (accountsToDeactivate.length === 0) {
        return {
          deactivatedCount: 0,
          accounts: [],
          message: 'No inactive accounts found'
        };
      }

      // 批量禁用账户
      const result = await this.batchUpdateAccountStatus(
        accountsToDeactivate.map(a => a.id),
        false,
        `Auto-deactivated due to ${inactiveDays} days of inactivity`
      );

      return {
        deactivatedCount: result.successCount,
        failedCount: result.failCount,
        accounts: result.successful,
        message: `Auto-deactivated ${result.successCount} inactive accounts`
      };
    } catch (error) {
      console.error('Error auto-deactivating inactive accounts:', error);
      throw error;
    }
  }

  /**
   * 检查账户是否有活跃交易
   */
  private async hasActiveTransactions(accountId: string): Promise<boolean> {
    try {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 最近30天

      const recentTransactionCount = await prisma.transaction.count({
        where: {
          OR: [
            { fromAccountId: accountId },
            { toAccountId: accountId }
          ],
          date: {
            gte: recentDate
          }
        }
      });

      return recentTransactionCount > 0;
    } catch (error) {
      console.error('Error checking active transactions:', error);
      return false;
    }
  }

  /**
   * 记录状态变更历史
   */
  private async recordStatusChange(
    accountId: string, 
    previousStatus: boolean, 
    newStatus: boolean, 
    reason?: string
  ) {
    try {
      const historyKey = `account_status_history_${accountId}`;
      
      // 获取现有历史
      const existingConfig = await prisma.systemConfig.findUnique({
        where: { key: historyKey }
      });

      let history: any[] = [];
      if (existingConfig) {
        history = JSON.parse(existingConfig.value);
      }

      // 添加新记录
      const newRecord = {
        timestamp: new Date().toISOString(),
        previousStatus,
        newStatus,
        reason: reason || 'No reason provided',
        action: newStatus ? 'ACTIVATED' : 'DEACTIVATED'
      };

      history.push(newRecord);

      // 保持最近50条记录
      if (history.length > 50) {
        history = history.slice(-50);
      }

      // 保存历史
      await prisma.systemConfig.upsert({
        where: { key: historyKey },
        create: {
          key: historyKey,
          value: JSON.stringify(history),
          description: `Status change history for account ${accountId}`,
          category: 'account_history'
        },
        update: {
          value: JSON.stringify(history),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error recording status change:', error);
      // 不抛出错误，避免影响主要操作
    }
  }

  /**
   * 获取账户状态验证报告
   */
  async getAccountStatusValidationReport(userId: string) {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId }
      });

      const report = {
        totalAccounts: accounts.length,
        activeAccounts: 0,
        inactiveAccounts: 0,
        issues: [] as Array<{
          accountId: string;
          accountName: string;
          issue: string;
          severity: 'low' | 'medium' | 'high';
          recommendation: string;
        }>,
        recommendations: [] as string[]
      };

      for (const account of accounts) {
        if (account.isActive) {
          report.activeAccounts++;
          
          // 检查是否有长期未使用
          const hasRecentActivity = await this.hasActiveTransactions(account.id);
          if (!hasRecentActivity) {
            report.issues.push({
              accountId: account.id,
              accountName: account.name,
              issue: 'Account is active but has no recent transactions',
              severity: 'low',
              recommendation: 'Consider reviewing account usage or deactivating if no longer needed'
            });
          }
        } else {
          report.inactiveAccounts++;
          
          // 检查是否有非零余额
          const balance = await this.calculateRealTimeBalance(account.id);
          if (!balance.equals(0)) {
            report.issues.push({
              accountId: account.id,
              accountName: account.name,
              issue: `Inactive account has non-zero balance: ${currencyService.formatAmount(balance, account.currency)}`,
              severity: 'medium',
              recommendation: 'Transfer remaining balance or reactivate account'
            });
          }
        }
      }

      // 生成总体建议
      if (report.inactiveAccounts > report.activeAccounts) {
        report.recommendations.push('Consider cleaning up inactive accounts to improve system performance');
      }
      
      if (report.issues.filter(i => i.severity === 'medium' || i.severity === 'high').length > 0) {
        report.recommendations.push('Address medium and high severity issues promptly');
      }

      return report;
    } catch (error) {
      console.error('Error generating account status validation report:', error);
      throw error;
    }
  }

  /**
   * 安全删除账户（带保护机制）
   */
  async safeDeleteAccount(accountId: string, forceDelete: boolean = false) {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // 检查删除前提条件
      const protectionCheck = await this.checkAccountDeletionProtection(accountId);
      
      if (!protectionCheck.canDelete && !forceDelete) {
        throw new Error(`Cannot delete account: ${protectionCheck.reasons.join(', ')}`);
      }

      // 如果强制删除，需要先处理依赖关系
      if (forceDelete && !protectionCheck.canDelete) {
        await this.handleDependenciesBeforeDeletion(accountId);
      }

      // 执行软删除
      const deletedAccount = await prisma.account.update({
        where: { id: accountId },
        data: {
          isActive: false,
          // 在实际项目中，应该添加 isDeleted 和 deletedAt 字段
          // isDeleted: true,
          // deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 记录删除操作
      await this.recordAccountDeletion(accountId, forceDelete, protectionCheck.warnings);

      return {
        ...deletedAccount,
        balance: deletedAccount.balance.toString(),
        formattedBalance: currencyService.formatAmount(deletedAccount.balance, deletedAccount.currency),
        deletionInfo: {
          deletedAt: new Date(),
          forceDelete,
          warnings: protectionCheck.warnings,
          canRestore: true
        }
      };
    } catch (error) {
      console.error('Error safely deleting account:', error);
      throw error;
    }
  }

  /**
   * 检查账户删除保护条件
   */
  async checkAccountDeletionProtection(accountId: string) {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      const protectionResult = {
        canDelete: true,
        reasons: [] as string[],
        warnings: [] as string[],
        dependencies: {
          transactionCount: 0,
          recentTransactionCount: 0,
          budgetCount: 0,
          nonZeroBalance: false,
          balance: '0'
        }
      };

      // 检查账户余额
      const realTimeBalance = await this.calculateRealTimeBalance(accountId);
      protectionResult.dependencies.balance = realTimeBalance.toString();
      
      if (!realTimeBalance.equals(0)) {
        protectionResult.dependencies.nonZeroBalance = true;
        protectionResult.canDelete = false;
        protectionResult.reasons.push(`Account has non-zero balance: ${currencyService.formatAmount(realTimeBalance, account.currency)}`);
      }

      // 检查交易记录
      const transactionCount = await prisma.transaction.count({
        where: {
          OR: [
            { fromAccountId: accountId },
            { toAccountId: accountId }
          ]
        }
      });
      
      protectionResult.dependencies.transactionCount = transactionCount;
      
      if (transactionCount > 0) {
        protectionResult.canDelete = false;
        protectionResult.reasons.push(`Account has ${transactionCount} transaction records`);
      }

      // 检查最近交易
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);
      
      const recentTransactionCount = await prisma.transaction.count({
        where: {
          OR: [
            { fromAccountId: accountId },
            { toAccountId: accountId }
          ],
          date: {
            gte: recentDate
          }
        }
      });
      
      protectionResult.dependencies.recentTransactionCount = recentTransactionCount;
      
      if (recentTransactionCount > 0) {
        protectionResult.warnings.push(`Account has ${recentTransactionCount} transactions in the last 30 days`);
      }

      // 检查预算关联
      const budgetCount = await prisma.budget.count({
        where: { accountId }
      });
      
      protectionResult.dependencies.budgetCount = budgetCount;
      
      if (budgetCount > 0) {
        protectionResult.canDelete = false;
        protectionResult.reasons.push(`Account is associated with ${budgetCount} budget(s)`);
      }

      // 检查账户是否是主账户
      const userAccountCount = await prisma.account.count({
        where: { 
          userId: account.userId,
          isActive: true 
        }
      });

      if (userAccountCount === 1) {
        protectionResult.warnings.push('This is the user\'s only active account');
      }

      return protectionResult;
    } catch (error) {
      console.error('Error checking account deletion protection:', error);
      throw error;
    }
  }

  /**
   * 批量删除账户（带保护机制）
   */
  async batchSafeDeleteAccounts(accountIds: string[], forceDelete: boolean = false) {
    try {
      const results = await Promise.allSettled(
        accountIds.map(accountId => 
          this.safeDeleteAccount(accountId, forceDelete)
        )
      );

      const successful: any[] = [];
      const failed: Array<{accountId: string, error: string}> = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push({
            accountId: accountIds[index],
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      return {
        successful,
        failed,
        totalRequested: accountIds.length,
        successCount: successful.length,
        failCount: failed.length,
        forceDelete
      };
    } catch (error) {
      console.error('Error batch deleting accounts:', error);
      throw error;
    }
  }

  /**
   * 恢复已删除的账户
   */
  async restoreDeletedAccount(accountId: string, reason?: string) {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      if (account.isActive) {
        throw new Error('Account is not deleted');
      }

      // 恢复账户
      const restoredAccount = await prisma.account.update({
        where: { id: accountId },
        data: {
          isActive: true,
          updatedAt: new Date()
        }
      });

      // 记录恢复操作
      await this.recordAccountRestoration(accountId, reason);

      return {
        ...restoredAccount,
        balance: restoredAccount.balance.toString(),
        formattedBalance: currencyService.formatAmount(restoredAccount.balance, restoredAccount.currency),
        restorationInfo: {
          restoredAt: new Date(),
          reason: reason || 'No reason provided'
        }
      };
    } catch (error) {
      console.error('Error restoring deleted account:', error);
      throw error;
    }
  }

  /**
   * 获取用户的已删除账户列表
   */
  async getDeletedAccounts(userId: string) {
    try {
      const deletedAccounts = await prisma.account.findMany({
        where: { 
          userId,
          isActive: false // 在实际项目中应该检查 isDeleted: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      return deletedAccounts.map(account => ({
        ...account,
        balance: account.balance.toString(),
        formattedBalance: currencyService.formatAmount(account.balance, account.currency),
        canRestore: true, // 可以添加更复杂的逻辑来判断是否可以恢复
        deletedAt: account.updatedAt // 在实际项目中应该使用 deletedAt 字段
      }));
    } catch (error) {
      console.error('Error getting deleted accounts:', error);
      throw error;
    }
  }

  /**
   * 永久删除账户（真正的物理删除）
   */
  async permanentDeleteAccount(accountId: string) {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      if (account.isActive) {
        throw new Error('Cannot permanently delete active account. Deactivate first.');
      }

      // 检查是否还有关联数据
      const protectionCheck = await this.checkAccountDeletionProtection(accountId);
      if (protectionCheck.dependencies.transactionCount > 0 || 
          protectionCheck.dependencies.budgetCount > 0) {
        throw new Error('Cannot permanently delete account with associated data');
      }

      // 永久删除账户
      await prisma.account.delete({
        where: { id: accountId }
      });

      // 记录永久删除操作
      await this.recordPermanentDeletion(accountId);

      return {
        accountId,
        accountName: account.name,
        permanentlyDeletedAt: new Date(),
        message: 'Account permanently deleted'
      };
    } catch (error) {
      console.error('Error permanently deleting account:', error);
      throw error;
    }
  }

  /**
   * 获取账户删除历史
   */
  async getAccountDeletionHistory(userId: string) {
    try {
      // 从系统配置表获取删除历史
      const historyKey = `account_deletion_history_${userId}`;
      const config = await prisma.systemConfig.findUnique({
        where: { key: historyKey }
      });

      if (!config) {
        return [];
      }

      const history = JSON.parse(config.value);
      return history.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }));
    } catch (error) {
      console.error('Error getting account deletion history:', error);
      return [];
    }
  }

  /**
   * 处理删除前的依赖关系
   */
  private async handleDependenciesBeforeDeletion(accountId: string) {
    try {
      // 禁用相关预算
      await prisma.budget.updateMany({
        where: { accountId },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });

      // 注意：通常不应该删除交易记录，这里只是标记为隐藏或归档
      // 在实际项目中，应该创建归档机制而不是删除历史数据

      console.log(`Dependencies handled for account ${accountId}`);
    } catch (error) {
      console.error('Error handling dependencies before deletion:', error);
      throw error;
    }
  }

  /**
   * 记录账户删除操作
   */
  private async recordAccountDeletion(
    accountId: string,
    forceDelete: boolean,
    warnings: string[]
  ) {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) return;

      const historyKey = `account_deletion_history_${account.userId}`;
      
      // 获取现有历史
      const existingConfig = await prisma.systemConfig.findUnique({
        where: { key: historyKey }
      });

      let history: any[] = [];
      if (existingConfig) {
        history = JSON.parse(existingConfig.value);
      }

      // 添加新记录
      const newRecord = {
        timestamp: new Date().toISOString(),
        accountId,
        accountName: account.name,
        action: 'DELETED',
        forceDelete,
        warnings,
        balance: account.balance.toString(),
        currency: account.currency
      };

      history.push(newRecord);

      // 保持最近100条记录
      if (history.length > 100) {
        history = history.slice(-100);
      }

      // 保存历史
      await prisma.systemConfig.upsert({
        where: { key: historyKey },
        create: {
          key: historyKey,
          value: JSON.stringify(history),
          description: `Account deletion history for user ${account.userId}`,
          category: 'account_deletion'
        },
        update: {
          value: JSON.stringify(history),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error recording account deletion:', error);
    }
  }

  /**
   * 记录账户恢复操作
   */
  private async recordAccountRestoration(accountId: string, reason?: string) {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account) return;

      const historyKey = `account_deletion_history_${account.userId}`;
      
      const existingConfig = await prisma.systemConfig.findUnique({
        where: { key: historyKey }
      });

      let history: any[] = [];
      if (existingConfig) {
        history = JSON.parse(existingConfig.value);
      }

      const newRecord = {
        timestamp: new Date().toISOString(),
        accountId,
        accountName: account.name,
        action: 'RESTORED',
        reason: reason || 'No reason provided'
      };

      history.push(newRecord);

      await prisma.systemConfig.upsert({
        where: { key: historyKey },
        create: {
          key: historyKey,
          value: JSON.stringify(history),
          description: `Account deletion history for user ${account.userId}`,
          category: 'account_deletion'
        },
        update: {
          value: JSON.stringify(history),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error recording account restoration:', error);
    }
  }

  /**
   * 记录永久删除操作
   */
  private async recordPermanentDeletion(accountId: string) {
    try {
      // 这里应该记录到专门的永久删除日志中
      console.log(`Account ${accountId} permanently deleted at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Error recording permanent deletion:', error);
    }
  }

  /**
   * 获取账户删除保护报告
   */
  async getAccountDeletionProtectionReport(userId: string) {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId }
      });

      const report = {
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter(a => a.isActive).length,
        deletedAccounts: accounts.filter(a => !a.isActive).length,
        protectionAnalysis: {
          fullyProtected: 0,
          partiallyProtected: 0,
          canDelete: 0,
          accountAnalysis: [] as any[]
        },
        recommendations: [] as string[]
      };

      for (const account of accounts) {
        if (account.isActive) {
          const protection = await this.checkAccountDeletionProtection(account.id);
          
          const analysis = {
            accountId: account.id,
            accountName: account.name,
            canDelete: protection.canDelete,
            protectionReasons: protection.reasons,
            warnings: protection.warnings,
            dependencies: protection.dependencies
          };

          report.protectionAnalysis.accountAnalysis.push(analysis);

          if (!protection.canDelete && protection.reasons.length > 2) {
            report.protectionAnalysis.fullyProtected++;
          } else if (!protection.canDelete) {
            report.protectionAnalysis.partiallyProtected++;
          } else {
            report.protectionAnalysis.canDelete++;
          }
        }
      }

      // 生成建议
      if (report.protectionAnalysis.canDelete > 0) {
        report.recommendations.push(`${report.protectionAnalysis.canDelete} accounts can be safely deleted if no longer needed`);
      }

      if (report.deletedAccounts > 0) {
        report.recommendations.push(`${report.deletedAccounts} deleted accounts can be restored or permanently removed`);
      }

      return report;
    } catch (error) {
      console.error('Error generating account deletion protection report:', error);
      throw error;
    }
  }
}

export const accountService = new AccountService();