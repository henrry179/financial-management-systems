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

// 高级分类功能路由
router.get(
  '/stats/user',
  asyncHandler(categoryController.getUserCategoryStats.bind(categoryController))
);

router.get(
  '/:id/trends',
  uuidParamValidation,
  validateRequest,
  asyncHandler(categoryController.getCategoryTrends.bind(categoryController))
);

router.post(
  '/suggestions',
  [
    body('description')
      .isLength({ min: 1, max: 500 })
      .withMessage('Description must be 1-500 characters long'),
    body('amount')
      .isDecimal({ decimal_digits: '0,2' })
      .withMessage('Amount must be a valid decimal number'),
    body('type')
      .isIn(['INCOME', 'EXPENSE'])
      .withMessage('Type must be INCOME or EXPENSE'),
  ],
  validateRequest,
  asyncHandler(categoryController.getSuggestedCategories.bind(categoryController))
);

router.get(
  '/analysis/usage',
  asyncHandler(categoryController.getCategoryUsageAnalysis.bind(categoryController))
);

router.post(
  '/batch-operations',
  [
    body('operations')
      .isArray({ min: 1, max: 50 })
      .withMessage('operations must be an array with 1-50 items'),
    body('operations.*.categoryId')
      .isUUID()
      .withMessage('Each categoryId must be a valid UUID'),
    body('operations.*.operation')
      .isIn(['activate', 'deactivate', 'delete', 'merge'])
      .withMessage('Each operation must be one of: activate, deactivate, delete, merge'),
    body('operations.*.targetCategoryId')
      .optional()
      .isUUID()
      .withMessage('targetCategoryId must be a valid UUID when provided'),
  ],
  validateRequest,
  asyncHandler(categoryController.batchUpdateCategories.bind(categoryController))
);

router.post(
  '/import-template',
  [
    body('templateType')
      .isIn(['basic', 'detailed', 'business'])
      .withMessage('templateType must be one of: basic, detailed, business'),
  ],
  validateRequest,
  asyncHandler(categoryController.importCategoryTemplate.bind(categoryController))
);

export default router; 