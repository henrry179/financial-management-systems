import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { BudgetController } from '../controllers/budgetController';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const budgetController = new BudgetController();

// Budget creation validation
const createBudgetValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Budget name must be 1-100 characters long'),
  body('amount')
    .isDecimal({ decimal_digits: '0,2' })
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Amount must be a positive decimal number'),
  body('period')
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
    .withMessage('Period must be DAILY, WEEKLY, MONTHLY, QUARTERLY, or YEARLY'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('accountId')
    .optional()
    .isUUID()
    .withMessage('Account ID must be a valid UUID'),
  body('alertThreshold')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .custom((value) => !value || (parseFloat(value) >= 0 && parseFloat(value) <= 1))
    .withMessage('Alert threshold must be between 0 and 1'),
];

// Budget update validation
const updateBudgetValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Budget name must be 1-100 characters long'),
  body('amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .custom((value) => !value || parseFloat(value) > 0)
    .withMessage('Amount must be a positive decimal number'),
  body('period')
    .optional()
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
    .withMessage('Period must be DAILY, WEEKLY, MONTHLY, QUARTERLY, or YEARLY'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('accountId')
    .optional()
    .isUUID()
    .withMessage('Account ID must be a valid UUID'),
  body('alertThreshold')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .custom((value) => !value || (parseFloat(value) >= 0 && parseFloat(value) <= 1))
    .withMessage('Alert threshold must be between 0 and 1'),
];

// UUID param validation
const uuidParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid budget ID'),
];

// Query validation for filtering
const filterValidation = [
  query('period')
    .optional()
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
    .withMessage('Period must be DAILY, WEEKLY, MONTHLY, QUARTERLY, or YEARLY'),
  query('accountId')
    .optional()
    .isUUID()
    .withMessage('Account ID must be a valid UUID'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// Routes
router.get(
  '/',
  filterValidation,
  validateRequest,
  asyncHandler(budgetController.getBudgets.bind(budgetController))
);

router.post(
  '/',
  createBudgetValidation,
  validateRequest,
  asyncHandler(budgetController.createBudget.bind(budgetController))
);

router.get(
  '/overview',
  asyncHandler(budgetController.getBudgetsOverview.bind(budgetController))
);

router.get(
  '/alerts',
  asyncHandler(budgetController.getBudgetAlerts.bind(budgetController))
);

router.get(
  '/:id',
  uuidParamValidation,
  validateRequest,
  asyncHandler(budgetController.getBudget.bind(budgetController))
);

router.put(
  '/:id',
  uuidParamValidation,
  updateBudgetValidation,
  validateRequest,
  asyncHandler(budgetController.updateBudget.bind(budgetController))
);

router.delete(
  '/:id',
  uuidParamValidation,
  validateRequest,
  asyncHandler(budgetController.deleteBudget.bind(budgetController))
);

router.get(
  '/:id/progress',
  uuidParamValidation,
  validateRequest,
  asyncHandler(budgetController.getBudgetProgress.bind(budgetController))
);

router.post(
  '/:id/reset',
  uuidParamValidation,
  validateRequest,
  asyncHandler(budgetController.resetBudget.bind(budgetController))
);

export default router; 