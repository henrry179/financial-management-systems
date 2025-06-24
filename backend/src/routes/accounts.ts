import { Router } from 'express';
import { body, param } from 'express-validator';
import { AccountController } from '../controllers/accountController';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const accountController = new AccountController();

// Account creation validation
const createAccountValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Account name must be 1-100 characters long'),
  body('type')
    .isIn(['CASH', 'SAVINGS', 'CHECKING', 'CREDIT_CARD', 'INVESTMENT', 'LOAN'])
    .withMessage('Invalid account type'),
  body('balance')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Balance must be a valid decimal number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-character code'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('bankName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Bank name must not exceed 100 characters'),
  body('accountNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Account number must not exceed 50 characters'),
];

// Account update validation
const updateAccountValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Account name must be 1-100 characters long'),
  body('type')
    .optional()
    .isIn(['CASH', 'SAVINGS', 'CHECKING', 'CREDIT_CARD', 'INVESTMENT', 'LOAN'])
    .withMessage('Invalid account type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('bankName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Bank name must not exceed 100 characters'),
  body('accountNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Account number must not exceed 50 characters'),
];

// Balance update validation
const updateBalanceValidation = [
  body('balance')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Balance must be a valid decimal number'),
];

// UUID param validation
const uuidParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid account ID'),
];

// Routes
router.get(
  '/',
  asyncHandler(accountController.getAccounts.bind(accountController))
);

router.post(
  '/',
  createAccountValidation,
  validateRequest,
  asyncHandler(accountController.createAccount.bind(accountController))
);

router.get(
  '/:id',
  uuidParamValidation,
  validateRequest,
  asyncHandler(accountController.getAccount.bind(accountController))
);

router.put(
  '/:id',
  uuidParamValidation,
  updateAccountValidation,
  validateRequest,
  asyncHandler(accountController.updateAccount.bind(accountController))
);

router.delete(
  '/:id',
  uuidParamValidation,
  validateRequest,
  asyncHandler(accountController.deleteAccount.bind(accountController))
);

router.put(
  '/:id/balance',
  uuidParamValidation,
  updateBalanceValidation,
  validateRequest,
  asyncHandler(accountController.updateBalance.bind(accountController))
);

router.get(
  '/:id/transactions',
  uuidParamValidation,
  validateRequest,
  asyncHandler(accountController.getAccountTransactions.bind(accountController))
);

router.get(
  '/:id/statistics',
  uuidParamValidation,
  validateRequest,
  asyncHandler(accountController.getAccountStatistics.bind(accountController))
);

export default router; 