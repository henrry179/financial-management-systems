import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

export class AccountController {
  async getAccounts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      const accounts = await prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ACCOUNTS_ERROR',
          message: 'Failed to fetch accounts',
        },
      });
    }
  }

  async createAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { name, type, balance, currency, description } = req.body;

      const account = await prisma.account.create({
        data: {
          name,
          type,
          balance: parseFloat(balance),
          currency: currency || 'CNY',
          description,
          userId,
        },
      });

      res.status(201).json({
        success: true,
        data: account,
      });
    } catch (error) {
      console.error('Error creating account:', error);
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

      await prisma.account.delete({
        where: { id: id, userId },
      });

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting account:', error);
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
        where: { accountId: id },
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

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const [transactions, incomeTotal, expenseTotal] = await Promise.all([
        prisma.transaction.count({
          where: { accountId: id },
        }),
        prisma.transaction.aggregate({
          where: {
            accountId: id,
            type: 'INCOME',
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.transaction.aggregate({
          where: {
            accountId: id,
            type: 'EXPENSE',
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          balance: account.balance,
          totalTransactions: transactions,
          currentMonthIncome: incomeTotal._sum.amount || 0,
          currentMonthExpense: expenseTotal._sum.amount || 0,
          netChange: (incomeTotal._sum.amount || 0) - (expenseTotal._sum.amount || 0),
        },
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
} 