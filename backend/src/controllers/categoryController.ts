import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { categoryService } from '../services/categoryService';

export class CategoryController {
  async getCategories(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      const categories = await prisma.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      });

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_CATEGORIES_ERROR',
          message: 'Failed to fetch categories',
        },
      });
    }
  }

  async getCategoriesTree(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      const categories = await prisma.category.findMany({
        where: { userId },
        include: {
          children: true,
        },
        orderBy: { name: 'asc' },
      });

      // 构建树形结构
      const buildTree = (items: any[], parentId: string | null = null) => {
        return items
          .filter(item => item.parentId === parentId)
          .map(item => ({
            ...item,
            children: buildTree(items, item.id),
          }));
      };

      const tree = buildTree(categories);

      res.json({
        success: true,
        data: tree,
      });
    } catch (error) {
      console.error('Error fetching categories tree:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_CATEGORIES_TREE_ERROR',
          message: 'Failed to fetch categories tree',
        },
      });
    }
  }

  async createDefaultCategories(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      const defaultCategories = [
        // 收入分类
        { name: '工资', type: 'INCOME', color: '#52c41a', icon: 'money-collect' },
        { name: '奖金', type: 'INCOME', color: '#52c41a', icon: 'gift' },
        { name: '投资收益', type: 'INCOME', color: '#52c41a', icon: 'rise' },
        { name: '其他收入', type: 'INCOME', color: '#52c41a', icon: 'plus' },
        
        // 支出分类
        { name: '餐饮', type: 'EXPENSE', color: '#ff4d4f', icon: 'coffee' },
        { name: '交通', type: 'EXPENSE', color: '#ff4d4f', icon: 'car' },
        { name: '购物', type: 'EXPENSE', color: '#ff4d4f', icon: 'shopping' },
        { name: '娱乐', type: 'EXPENSE', color: '#ff4d4f', icon: 'play-circle' },
        { name: '医疗', type: 'EXPENSE', color: '#ff4d4f', icon: 'medicine-box' },
        { name: '教育', type: 'EXPENSE', color: '#ff4d4f', icon: 'book' },
        { name: '住房', type: 'EXPENSE', color: '#ff4d4f', icon: 'home' },
        { name: '其他支出', type: 'EXPENSE', color: '#ff4d4f', icon: 'minus' },
      ];

      const createdCategories = [];
      for (const category of defaultCategories) {
        const existing = await prisma.category.findFirst({
          where: { userId, name: category.name },
        });
        
        if (!existing) {
          const created = await prisma.category.create({
            data: {
              ...category,
              userId,
            },
          });
          createdCategories.push(created);
        }
      }

      res.json({
        success: true,
        data: createdCategories,
        message: `Created ${createdCategories.length} default categories`,
      });
    } catch (error) {
      console.error('Error creating default categories:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_DEFAULT_CATEGORIES_ERROR',
          message: 'Failed to create default categories',
        },
      });
    }
  }

  async getCategory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const category = await prisma.category.findFirst({
        where: { id, userId },
        include: {
          children: true,
          transactions: {
            take: 10,
            orderBy: { date: 'desc' },
          },
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        });
      }

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_CATEGORY_ERROR',
          message: 'Failed to fetch category',
        },
      });
    }
  }

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { name, type, color, icon, description } = req.body;

      const category = await prisma.category.create({
        data: {
          name,
          type,
          color: color || '#1890ff',
          icon: icon || 'tag',
          description,
          userId,
        },
      });

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_CATEGORY_ERROR',
          message: 'Failed to create category',
        },
      });
    }
  }

  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { name, type, color, icon, description } = req.body;

      const category = await prisma.category.update({
        where: { id: id, userId },
        data: {
          name,
          type,
          color,
          icon,
          description,
        },
      });

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_CATEGORY_ERROR',
          message: 'Failed to update category',
        },
      });
    }
  }

  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      await prisma.category.delete({
        where: { id: id, userId },
      });

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_CATEGORY_ERROR',
          message: 'Failed to delete category',
        },
      });
    }
  }

  async getCategoryTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const transactions = await prisma.transaction.findMany({
        where: { 
          categoryId: id,
          userId,
        },
        include: {
          category: true,
          fromAccount: true,
          toAccount: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
      });

      const total = await prisma.transaction.count({
        where: { 
          categoryId: id,
          userId,
        },
      });

      res.json({
        success: true,
        data: transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching category transactions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_CATEGORY_TRANSACTIONS_ERROR',
          message: 'Failed to fetch category transactions',
        },
      });
    }
  }

  async getCategoryStatistics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { period = 'month' } = req.query;

      // 计算时间范围
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          categoryId: id,
          userId,
          date: {
            gte: startDate,
            lte: now,
          },
        },
      });

      const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const transactionCount = transactions.length;

      res.json({
        success: true,
        data: {
          totalAmount,
          transactionCount,
          period,
          startDate,
          endDate: now,
        },
      });
    } catch (error) {
      console.error('Error fetching category statistics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_CATEGORY_STATISTICS_ERROR',
          message: 'Failed to fetch category statistics',
        },
      });
    }
  }

  async getUserCategoryStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { period = 'month' } = req.query;

      const stats = await categoryService.getUserCategoryStats(
        userId,
        period as 'week' | 'month' | 'year'
      );

      res.json({
        success: true,
        data: stats,
        message: 'User category statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching user category stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_USER_CATEGORY_STATS_ERROR',
          message: 'Failed to fetch user category statistics',
        },
      });
    }
  }

  async getCategoryTrends(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { days = 30 } = req.query;

      const trends = await categoryService.getCategoryTrends(
        userId,
        id,
        parseInt(days as string)
      );

      res.json({
        success: true,
        data: trends,
        message: 'Category trends retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching category trends:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_CATEGORY_TRENDS_ERROR',
          message: 'Failed to fetch category trends',
        },
      });
    }
  }

  async getSuggestedCategories(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { description, amount, type } = req.body;

      if (!description || !amount || !type) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'description, amount, and type are required',
          },
        });
      }

      const suggestions = await categoryService.getSuggestedCategories(
        userId,
        description,
        parseFloat(amount),
        type
      );

      res.json({
        success: true,
        data: suggestions,
        message: 'Category suggestions retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting suggested categories:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_SUGGESTED_CATEGORIES_ERROR',
          message: 'Failed to get suggested categories',
        },
      });
    }
  }

  async getCategoryUsageAnalysis(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const analysis = await categoryService.getCategoryUsageAnalysis(userId);

      res.json({
        success: true,
        data: analysis,
        message: 'Category usage analysis retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting category usage analysis:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_CATEGORY_USAGE_ANALYSIS_ERROR',
          message: 'Failed to get category usage analysis',
        },
      });
    }
  }

  async batchUpdateCategories(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { operations } = req.body;

      if (!Array.isArray(operations) || operations.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OPERATIONS',
            message: 'operations must be a non-empty array',
          },
        });
      }

      const result = await categoryService.batchUpdateCategories(userId, operations);

      res.json({
        success: true,
        data: result,
        message: 'Batch category operations completed'
      });
    } catch (error) {
      console.error('Error batch updating categories:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BATCH_UPDATE_CATEGORIES_ERROR',
          message: 'Failed to batch update categories',
        },
      });
    }
  }

  async importCategoryTemplate(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { templateType } = req.body;

      if (!templateType || !['basic', 'detailed', 'business'].includes(templateType)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TEMPLATE_TYPE',
            message: 'templateType must be one of: basic, detailed, business',
          },
        });
      }

      const result = await categoryService.importCategoryTemplate(userId, templateType);

      res.json({
        success: true,
        data: result,
        message: `${templateType} category template imported successfully`
      });
    } catch (error) {
      console.error('Error importing category template:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'IMPORT_CATEGORY_TEMPLATE_ERROR',
          message: 'Failed to import category template',
        },
      });
    }
  }
} 