import { Request, Response } from 'express';
import { prisma } from '../index';
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
} 