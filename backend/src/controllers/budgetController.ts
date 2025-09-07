import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export class BudgetController {
  async getBudgets(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      const budgets = await prisma.budget.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: budgets,
      });
    } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_BUDGETS_ERROR',
          message: 'Failed to fetch budgets',
        },
      });
    }
  }

  async createBudget(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { name, amount, period, categoryId, startDate, endDate, description } = req.body;

      const budget = await prisma.budget.create({
        data: {
          name,
          amount: parseFloat(amount),
          period,
          categoryId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          description,
          userId,
        },
      });

      res.status(201).json({
        success: true,
        data: budget,
      });
    } catch (error) {
      console.error('Error creating budget:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_BUDGET_ERROR',
          message: 'Failed to create budget',
        },
      });
    }
  }

  async updateBudget(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { name, amount, period, categoryId, startDate, endDate, description } = req.body;

      const budget = await prisma.budget.update({
        where: { id: id, userId },
        data: {
          name,
          amount: parseFloat(amount),
          period,
          categoryId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          description,
        },
      });

      res.json({
        success: true,
        data: budget,
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_BUDGET_ERROR',
          message: 'Failed to update budget',
        },
      });
    }
  }

  async deleteBudget(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      await prisma.budget.delete({
        where: { id: id, userId },
      });

      res.json({
        success: true,
        message: 'Budget deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_BUDGET_ERROR',
          message: 'Failed to delete budget',
        },
      });
    }
  }

  async getBudgetsOverview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      const budgets = await prisma.budget.findMany({
        where: { 
          userId,
          isActive: true,
        },
        include: {
          account: true,
        },
      });

      const overview = {
        totalBudgets: budgets.length,
        activeBudgets: budgets.filter(b => b.isActive).length,
        totalBudgeted: budgets.reduce((sum, b) => sum + Number(b.amount), 0),
        totalSpent: budgets.reduce((sum, b) => sum + Number(b.spent), 0),
        budgets: budgets.map(budget => ({
          ...budget,
          progress: Number(budget.amount) > 0 ? (Number(budget.spent) / Number(budget.amount)) * 100 : 0,
          remaining: Number(budget.amount) - Number(budget.spent),
        })),
      };

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      console.error('Error fetching budgets overview:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_BUDGETS_OVERVIEW_ERROR',
          message: 'Failed to fetch budgets overview',
        },
      });
    }
  }

  async getBudgetAlerts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      const budgets = await prisma.budget.findMany({
        where: { 
          userId,
          isActive: true,
        },
      });

      const alerts = budgets
        .filter(budget => {
          const progress = Number(budget.amount) > 0 ? (Number(budget.spent) / Number(budget.amount)) : 0;
          return progress >= (budget.alertThreshold || 0.8);
        })
        .map(budget => ({
          ...budget,
          progress: Number(budget.amount) > 0 ? (Number(budget.spent) / Number(budget.amount)) * 100 : 0,
          remaining: Number(budget.amount) - Number(budget.spent),
        }));

      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      console.error('Error fetching budget alerts:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_BUDGET_ALERTS_ERROR',
          message: 'Failed to fetch budget alerts',
        },
      });
    }
  }

  async getBudget(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const budget = await prisma.budget.findFirst({
        where: { id, userId },
        include: {
          account: true,
        },
      });

      if (!budget) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BUDGET_NOT_FOUND',
            message: 'Budget not found',
          },
        });
      }

      res.json({
        success: true,
        data: budget,
      });
    } catch (error) {
      console.error('Error fetching budget:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_BUDGET_ERROR',
          message: 'Failed to fetch budget',
        },
      });
    }
  }

  async getBudgetProgress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const budget = await prisma.budget.findFirst({
        where: { id, userId },
      });

      if (!budget) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BUDGET_NOT_FOUND',
            message: 'Budget not found',
          },
        });
      }

      const progress = Number(budget.amount) > 0 ? (Number(budget.spent) / Number(budget.amount)) * 100 : 0;
      const remaining = Number(budget.amount) - Number(budget.spent);

      res.json({
        success: true,
        data: {
          ...budget,
          progress,
          remaining,
          isOverBudget: Number(budget.spent) > Number(budget.amount),
        },
      });
    } catch (error) {
      console.error('Error fetching budget progress:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_BUDGET_PROGRESS_ERROR',
          message: 'Failed to fetch budget progress',
        },
      });
    }
  }

  async resetBudget(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const budget = await prisma.budget.update({
        where: { id, userId },
        data: {
          spent: 0,
        },
      });

      res.json({
        success: true,
        data: budget,
        message: 'Budget reset successfully',
      });
    } catch (error) {
      console.error('Error resetting budget:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'RESET_BUDGET_ERROR',
          message: 'Failed to reset budget',
        },
      });
    }
  }
} 