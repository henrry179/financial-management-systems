import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { TransactionController } from '../controllers/transactionController';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const transactionController = new TransactionController();

// Transaction creation validation
const createTransactionValidation = [
  body('fromAccountId')
    .optional()
    .isUUID()
    .withMessage('From account ID must be a valid UUID'),
  body('toAccountId')
    .optional()
    .isUUID()
    .withMessage('To account ID must be a valid UUID'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  body('amount')
    .isDecimal({ decimal_digits: '0,2' })
    .custom((value) => parseFloat(value) > 0)
    .withMessage('Amount must be a positive decimal number'),
  body('type')
    .isIn(['INCOME', 'EXPENSE', 'TRANSFER'])
    .withMessage('Transaction type must be INCOME, EXPENSE, or TRANSFER'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
];

// Transaction update validation
const updateTransactionValidation = [
  body('fromAccountId')
    .optional()
    .isUUID()
    .withMessage('From account ID must be a valid UUID'),
  body('toAccountId')
    .optional()
    .isUUID()
    .withMessage('To account ID must be a valid UUID'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  body('amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .custom((value) => !value || parseFloat(value) > 0)
    .withMessage('Amount must be a positive decimal number'),
  body('type')
    .optional()
    .isIn(['INCOME', 'EXPENSE', 'TRANSFER'])
    .withMessage('Transaction type must be INCOME, EXPENSE, or TRANSFER'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
];

// Query validation for filtering
const filterValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['INCOME', 'EXPENSE', 'TRANSFER'])
    .withMessage('Type must be INCOME, EXPENSE, or TRANSFER'),
  query('accountId')
    .optional()
    .isUUID()
    .withMessage('Account ID must be a valid UUID'),
  query('categoryId')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('minAmount')
    .optional()
    .isDecimal()
    .withMessage('Min amount must be a valid decimal number'),
  query('maxAmount')
    .optional()
    .isDecimal()
    .withMessage('Max amount must be a valid decimal number'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be 1-100 characters long'),
];

// UUID param validation
const uuidParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid transaction ID'),
];

// Routes
router.get(
  '/',
  filterValidation,
  validateRequest,
  asyncHandler(transactionController.getTransactions.bind(transactionController))
);

router.post(
  '/',
  createTransactionValidation,
  validateRequest,
  asyncHandler(transactionController.createTransaction.bind(transactionController))
);

router.get(
  '/statistics',
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
  query('year').optional().isInt({ min: 2000, max: 3000 }),
  query('month').optional().isInt({ min: 1, max: 12 }),
  validateRequest,
  asyncHandler(transactionController.getStatistics.bind(transactionController))
);

router.get(
  '/categories-summary',
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('type').optional().isIn(['INCOME', 'EXPENSE']),
  validateRequest,
  asyncHandler(transactionController.getCategoriesSummary.bind(transactionController))
);

router.post(
  '/bulk',
  body('transactions').isArray({ min: 1 }).withMessage('Transactions array is required'),
  validateRequest,
  asyncHandler(transactionController.createBulkTransactions.bind(transactionController))
);

router.get(
  '/:id',
  uuidParamValidation,
  validateRequest,
  asyncHandler(transactionController.getTransaction.bind(transactionController))
);

router.put(
  '/:id',
  uuidParamValidation,
  updateTransactionValidation,
  validateRequest,
  asyncHandler(transactionController.updateTransaction.bind(transactionController))
);

router.delete(
  '/:id',
  uuidParamValidation,
  validateRequest,
  asyncHandler(transactionController.deleteTransaction.bind(transactionController))
);

router.post(
  '/:id/duplicate',
  uuidParamValidation,
  validateRequest,
  asyncHandler(transactionController.duplicateTransaction.bind(transactionController))
);

export default router; 