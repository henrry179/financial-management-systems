import { Router } from 'express';
import { body, param } from 'express-validator';
import { CategoryController } from '../controllers/categoryController';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const categoryController = new CategoryController();

// Category creation validation
const createCategoryValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be 1-100 characters long'),
  body('type')
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('Category type must be INCOME or EXPENSE'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  body('icon')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters'),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('Parent ID must be a valid UUID'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

// Category update validation
const updateCategoryValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be 1-100 characters long'),
  body('type')
    .optional()
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('Category type must be INCOME or EXPENSE'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  body('icon')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters'),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('Parent ID must be a valid UUID'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

// UUID param validation
const uuidParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID'),
];

// Routes
router.get(
  '/',
  asyncHandler(categoryController.getCategories.bind(categoryController))
);

router.post(
  '/',
  createCategoryValidation,
  validateRequest,
  asyncHandler(categoryController.createCategory.bind(categoryController))
);

router.get(
  '/tree',
  asyncHandler(categoryController.getCategoriesTree.bind(categoryController))
);

router.get(
  '/default',
  asyncHandler(categoryController.createDefaultCategories.bind(categoryController))
);

router.get(
  '/:id',
  uuidParamValidation,
  validateRequest,
  asyncHandler(categoryController.getCategory.bind(categoryController))
);

router.put(
  '/:id',
  uuidParamValidation,
  updateCategoryValidation,
  validateRequest,
  asyncHandler(categoryController.updateCategory.bind(categoryController))
);

router.delete(
  '/:id',
  uuidParamValidation,
  validateRequest,
  asyncHandler(categoryController.deleteCategory.bind(categoryController))
);

router.get(
  '/:id/transactions',
  uuidParamValidation,
  validateRequest,
  asyncHandler(categoryController.getCategoryTransactions.bind(categoryController))
);

router.get(
  '/:id/statistics',
  uuidParamValidation,
  validateRequest,
  asyncHandler(categoryController.getCategoryStatistics.bind(categoryController))
);

export default router; 