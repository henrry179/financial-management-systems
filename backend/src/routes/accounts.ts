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
  asyncHandler(accountController.getAccountById.bind(accountController))
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

// 实时余额管理路由
router.post(
  '/:id/sync-balance',
  uuidParamValidation,
  validateRequest,
  asyncHandler(accountController.syncAccountBalance.bind(accountController))
);

router.post(
  '/sync-all-balances',
  asyncHandler(accountController.syncAllAccountBalances.bind(accountController))
);

router.get(
  '/:id/validate-balance',
  uuidParamValidation,
  validateRequest,
  asyncHandler(accountController.validateAccountBalance.bind(accountController))
);

// 多币种统计路由
router.get(
  '/:id/multi-currency-stats',
  uuidParamValidation,
  validateRequest,
  asyncHandler(accountController.getAccountMultiCurrencyStats.bind(accountController))
);

// 账户状态管理路由
router.put(
  '/:id/status',
  [
    ...uuidParamValidation,
    body('isActive')
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('reason must not exceed 500 characters'),
  ],
  validateRequest,
  asyncHandler(accountController.updateAccountStatus.bind(accountController))
);

router.post(
  '/batch-status-update',
  [
    body('accountIds')
      .isArray({ min: 1, max: 50 })
      .withMessage('accountIds must be an array with 1-50 items'),
    body('accountIds.*')
      .isUUID()
      .withMessage('Each accountId must be a valid UUID'),
    body('isActive')
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('reason must not exceed 500 characters'),
  ],
  validateRequest,
  asyncHandler(accountController.batchUpdateAccountStatus.bind(accountController))
);

router.get(
  '/:id/status-history',
  uuidParamValidation,
  validateRequest,
  asyncHandler(accountController.getAccountStatusHistory.bind(accountController))
);

router.get(
  '/status-stats',
  asyncHandler(accountController.getUserAccountStatusStats.bind(accountController))
);

router.post(
  '/auto-deactivate-inactive',
  [
    body('inactiveDays')
      .optional()
      .isInt({ min: 30, max: 3650 })
      .withMessage('inactiveDays must be an integer between 30 and 3650'),
    body('dryRun')
      .optional()
      .isBoolean()
      .withMessage('dryRun must be a boolean'),
  ],
  validateRequest,
  asyncHandler(accountController.autoDeactivateInactiveAccounts.bind(accountController))
);

router.get(
  '/status-validation-report',
  asyncHandler(accountController.getAccountStatusValidationReport.bind(accountController))
);

// 账户删除保护相关路由
router.get(
  '/:id/deletion-protection',
  uuidParamValidation,
  validateRequest,
  asyncHandler(accountController.checkAccountDeletionProtection.bind(accountController))
);

router.post(
  '/batch-delete',
  [
    body('accountIds')
      .isArray({ min: 1, max: 50 })
      .withMessage('accountIds must be an array with 1-50 items'),
    body('accountIds.*')
      .isUUID()
      .withMessage('Each accountId must be a valid UUID'),
    body('forceDelete')
      .optional()
      .isBoolean()
      .withMessage('forceDelete must be a boolean'),
  ],
  validateRequest,
  asyncHandler(accountController.batchSafeDeleteAccounts.bind(accountController))
);

router.post(
  '/:id/restore',
  [
    ...uuidParamValidation,
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('reason must not exceed 500 characters'),
  ],
  validateRequest,
  asyncHandler(accountController.restoreDeletedAccount.bind(accountController))
);

router.get(
  '/deleted',
  asyncHandler(accountController.getDeletedAccounts.bind(accountController))
);

router.delete(
  '/:id/permanent',
  uuidParamValidation,
  validateRequest,
  asyncHandler(accountController.permanentDeleteAccount.bind(accountController))
);

router.get(
  '/deletion-history',
  asyncHandler(accountController.getAccountDeletionHistory.bind(accountController))
);

router.get(
  '/deletion-protection-report',
  asyncHandler(accountController.getAccountDeletionProtectionReport.bind(accountController))
);

export default router; 