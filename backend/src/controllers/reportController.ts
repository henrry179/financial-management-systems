import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

export class ReportController {
  async getReports(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      const reports = await prisma.report.findMany({
        where: { userId },
        orderBy: { generatedAt: 'desc' },
      });

      res.json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_REPORTS_ERROR',
          message: 'Failed to fetch reports',
        },
      });
    }
  }

  async createReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { title, type, parameters, period } = req.body;

      const report = await prisma.report.create({
        data: {
          title,
          type,
          parameters,
          period,
          data: {},
          userId,
        },
      });

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_REPORT_ERROR',
          message: 'Failed to create report',
        },
      });
    }
  }

  async getReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const report = await prisma.report.findFirst({
        where: { id, userId },
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REPORT_NOT_FOUND',
            message: 'Report not found',
          },
        });
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_REPORT_ERROR',
          message: 'Failed to fetch report',
        },
      });
    }
  }

  async updateReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { title, parameters, data } = req.body;

      const report = await prisma.report.update({
        where: { id, userId },
        data: {
          title,
          parameters,
          data,
        },
      });

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_REPORT_ERROR',
          message: 'Failed to update report',
        },
      });
    }
  }

  async deleteReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      await prisma.report.delete({
        where: { id, userId },
      });

      res.json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_REPORT_ERROR',
          message: 'Failed to delete report',
        },
      });
    }
  }

  async generateReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { type, parameters, period } = req.body;

      let reportData = {};

      switch (type) {
        case 'INCOME_EXPENSE':
          reportData = await this.generateIncomeExpenseReport(userId, parameters, period);
          break;
        case 'BUDGET_ANALYSIS':
          reportData = await this.generateBudgetAnalysisReport(userId, parameters, period);
          break;
        case 'ACCOUNT_SUMMARY':
          reportData = await this.generateAccountSummaryReport(userId, parameters, period);
          break;
        default:
          throw new Error('Unsupported report type');
      }

      const report = await prisma.report.create({
        data: {
          title: `${type} Report - ${period}`,
          type,
          parameters,
          data: reportData,
          period,
          userId,
        },
      });

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GENERATE_REPORT_ERROR',
          message: 'Failed to generate report',
        },
      });
    }
  }

  private async generateIncomeExpenseReport(userId: string, parameters: any, period: string) {
    const startDate = new Date(period);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const categoryBreakdown = transactions.reduce((acc, t) => {
      const categoryName = t.category?.name || '未分类';
      if (!acc[categoryName]) {
        acc[categoryName] = { income: 0, expense: 0 };
      }
      if (t.type === 'INCOME') {
        acc[categoryName].income += Number(t.amount);
      } else {
        acc[categoryName].expense += Number(t.amount);
      }
      return acc;
    }, {} as any);

    return {
      period,
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      categoryBreakdown,
      transactionCount: transactions.length,
    };
  }

  private async generateBudgetAnalysisReport(userId: string, parameters: any, period: string) {
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        account: true,
      },
    });

    const budgetAnalysis = budgets.map(budget => ({
      id: budget.id,
      name: budget.name,
      budgeted: Number(budget.amount),
      spent: Number(budget.spent),
      remaining: Number(budget.amount) - Number(budget.spent),
      progress: Number(budget.amount) > 0 ? (Number(budget.spent) / Number(budget.amount)) * 100 : 0,
      isOverBudget: Number(budget.spent) > Number(budget.amount),
    }));

    return {
      period,
      totalBudgets: budgets.length,
      totalBudgeted: budgets.reduce((sum, b) => sum + Number(b.amount), 0),
      totalSpent: budgets.reduce((sum, b) => sum + Number(b.spent), 0),
      budgetAnalysis,
    };
  }

  private async generateAccountSummaryReport(userId: string, parameters: any, period: string) {
    const accounts = await prisma.account.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const accountSummary = accounts.map(account => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: Number(account.balance),
      currency: account.currency,
    }));

    return {
      period,
      totalAccounts: accounts.length,
      totalBalance: accounts.reduce((sum, a) => sum + Number(a.balance), 0),
      accountSummary,
    };
  }
} 