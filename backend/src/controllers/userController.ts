import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  async getProfile(req: AuthRequest, res: Response) {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        dateOfBirth: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  }

  async updateProfile(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { firstName, lastName, phone, dateOfBirth } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        dateOfBirth: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully',
    });
  }

  async uploadAvatar(req: AuthRequest, res: Response) {
    // This would typically handle file upload
    // For now, we'll just return a placeholder response
    res.json({
      success: true,
      message: 'Avatar upload functionality to be implemented',
      data: {
        avatarUrl: 'https://via.placeholder.com/150x150/1890ff/ffffff?text=Avatar',
      },
    });
  }

  async getSettings(req: AuthRequest, res: Response) {
    const userId = req.user!.id;

    const settings = await prisma.userSetting.findMany({
      where: { userId },
      select: {
        key: true,
        value: true,
        category: true,
      },
    });

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = setting.value;
      return acc;
    }, {} as Record<string, Record<string, string>>);

    res.json({
      success: true,
      data: { settings: groupedSettings },
    });
  }

  async updateSetting(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { key, value, category = 'general' } = req.body;

    const setting = await prisma.userSetting.upsert({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
      update: {
        value,
        category,
      },
      create: {
        userId,
        key,
        value,
        category,
      },
    });

    res.json({
      success: true,
      data: { setting },
      message: 'Setting updated successfully',
    });
  }

  async deleteSetting(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { key } = req.params;

    await prisma.userSetting.delete({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    res.json({
      success: true,
      message: 'Setting deleted successfully',
    });
  }

  async getDashboardStats(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get account balances
    const accounts = await prisma.account.findMany({
      where: { userId, isActive: true },
      select: { balance: true, type: true },
    });

    const totalBalance = accounts.reduce((sum, account) => {
      return sum + parseFloat(account.balance.toString());
    }, 0);

    // Get this month's transactions
    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: { amount: true, type: true },
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const monthlyExpense = monthlyTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Get active budgets
    const activeBudgets = await prisma.budget.count({
      where: {
        userId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        category: { select: { name: true, icon: true, color: true } },
        fromAccount: { select: { name: true } },
        toAccount: { select: { name: true } },
      },
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalBalance,
          monthlyIncome,
          monthlyExpense,
          activeBudgets,
          accountsCount: accounts.length,
          transactionsCount: monthlyTransactions.length,
        },
        recentTransactions,
      },
    });
  }

  async deleteAccount(req: AuthRequest, res: Response) {
    const userId = req.user!.id;

    // In a real application, you might want to:
    // 1. Anonymize user data instead of deleting
    // 2. Send confirmation email
    // 3. Keep transaction data for audit purposes
    // 4. Handle cascade deletions properly

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  }
} 