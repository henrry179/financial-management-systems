import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TransactionController {
  async getTransactions(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        accountId,
        categoryId,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search
      } = req.query;

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // Build filter conditions
      const where: any = { userId };

      if (type) {
        where.type = type;
      }

      if (accountId) {
        where.OR = [
          { fromAccountId: accountId },
          { toAccountId: accountId }
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate as string);
        if (endDate) where.date.lte = new Date(endDate as string);
      }

      if (minAmount || maxAmount) {
        where.amount = {};
        if (minAmount) where.amount.gte = Number(minAmount);
        if (maxAmount) where.amount.lte = Number(maxAmount);
      }

      if (search) {
        where.OR = [
          { description: { contains: search as string, mode: 'insensitive' } },
          { notes: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take,
          orderBy: { date: 'desc' },
          include: {
            fromAccount: true,
            toAccount: true,
            category: true
          }
        }),
        prisma.transaction.count({ where })
      ]);

      res.json({
        data: transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createTransaction(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const transaction = await prisma.transaction.create({
        data: {
          ...req.body,
          userId,
          amount: Number(req.body.amount),
          date: new Date(req.body.date)
        },
        include: {
          fromAccount: true,
          toAccount: true,
          category: true
        }
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createBulkTransactions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { transactions } = req.body;
      
      // Process transactions in batches
      const processedTransactions = transactions.map((t: any) => ({
        ...t,
        userId,
        amount: Number(t.amount),
        date: new Date(t.date)
      }));

      const result = await prisma.transaction.createMany({
        data: processedTransactions,
        skipDuplicates: true
      });

      res.status(201).json({
        message: `Successfully created ${result.count} transactions`,
        count: result.count
      });
    } catch (error) {
      console.error('Error creating bulk transactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const transaction = await prisma.transaction.findFirst({
        where: { id, userId },
        include: {
          fromAccount: true,
          toAccount: true,
          category: true
        }
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const updateData: any = { ...req.body };
      if (updateData.amount) updateData.amount = Number(updateData.amount);
      if (updateData.date) updateData.date = new Date(updateData.date);

      const transaction = await prisma.transaction.updateMany({
        where: { id, userId },
        data: updateData
      });

      if (transaction.count === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const updatedTransaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          fromAccount: true,
          toAccount: true,
          category: true
        }
      });

      res.json(updatedTransaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const result = await prisma.transaction.deleteMany({
        where: { id, userId }
      });

      if (result.count === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { period = 'month', year, month } = req.query;
      
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          endDate = now;
          break;
        case 'month':
          if (year && month) {
            startDate = new Date(Number(year), Number(month) - 1, 1);
            endDate = new Date(Number(year), Number(month), 0);
          } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          }
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
          break;
        case 'year':
          const targetYear = year ? Number(year) : now.getFullYear();
          startDate = new Date(targetYear, 0, 1);
          endDate = new Date(targetYear, 11, 31);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const [incomeSum, expenseSum, transactionCount] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'INCOME',
            date: { gte: startDate, lte: endDate }
          },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            date: { gte: startDate, lte: endDate }
          },
          _sum: { amount: true }
        }),
        prisma.transaction.count({
          where: {
            userId,
            date: { gte: startDate, lte: endDate }
          }
        })
      ]);

      const totalIncome = incomeSum._sum.amount || 0;
      const totalExpense = expenseSum._sum.amount || 0;
      const netIncome = Number(totalIncome) - Number(totalExpense);

      res.json({
        period,
        startDate,
        endDate,
        totalIncome,
        totalExpense,
        netIncome,
        transactionCount
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCategoriesSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { startDate, endDate, type } = req.query;

      const where: any = { userId };

      if (type) {
        where.type = type;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate as string);
        if (endDate) where.date.lte = new Date(endDate as string);
      }

      const summary = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: { id: true }
      });

      // Get category details
      const categoryIds = summary.map(s => s.categoryId).filter(Boolean);
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } }
      });

      const result = summary.map(s => {
        const category = categories.find(c => c.id === s.categoryId);
        return {
          categoryId: s.categoryId,
          categoryName: category?.name || 'Uncategorized',
          totalAmount: s._sum.amount || 0,
          transactionCount: s._count.id
        };
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching categories summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async duplicateTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const originalTransaction = await prisma.transaction.findFirst({
        where: { id, userId }
      });

      if (!originalTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const { id: _, createdAt, updatedAt, ...transactionData } = originalTransaction;

      const duplicatedTransaction = await prisma.transaction.create({
        data: {
          ...transactionData,
          description: `${transactionData.description} (复制)`,
          date: new Date() // Use current date for duplicated transaction
        },
        include: {
          fromAccount: true,
          toAccount: true,
          category: true
        }
      });

      res.status(201).json(duplicatedTransaction);
    } catch (error) {
      console.error('Error duplicating transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 