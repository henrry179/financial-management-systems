import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

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
} 