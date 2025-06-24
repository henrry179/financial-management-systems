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
} 