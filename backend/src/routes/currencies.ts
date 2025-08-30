import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { CurrencyController } from '../controllers/currencyController';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const currencyController = new CurrencyController();

// 货币代码验证
const currencyCodeValidation = [
  param('currency')
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('Currency code must be a 3-letter code'),
];

// 汇率查询验证
const exchangeRateValidation = [
  query('fromCurrency')
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('fromCurrency must be a 3-letter code'),
  query('toCurrency')
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('toCurrency must be a 3-letter code'),
];

// 金额转换验证
const convertAmountValidation = [
  body('amount')
    .isDecimal({ decimal_digits: '0,8' })
    .withMessage('Amount must be a valid decimal number'),
  body('fromCurrency')
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('fromCurrency must be a 3-letter code'),
  body('toCurrency')
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('toCurrency must be a 3-letter code'),
];

// 批量转换验证
const convertMultipleValidation = [
  body('amounts')
    .isArray({ min: 1, max: 50 })
    .withMessage('amounts must be an array with 1-50 items'),
  body('amounts.*.amount')
    .isDecimal({ decimal_digits: '0,8' })
    .withMessage('Each amount must be a valid decimal number'),
  body('amounts.*.currency')
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('Each currency must be a 3-letter code'),
  body('targetCurrency')
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('targetCurrency must be a 3-letter code'),
];

// 汇率历史验证
const rateHistoryValidation = [
  query('fromCurrency')
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('fromCurrency must be a 3-letter code'),
  query('toCurrency')
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('toCurrency must be a 3-letter code'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('days must be an integer between 1 and 365'),
];

// 基准货币验证
const baseCurrencyValidation = [
  query('baseCurrency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('baseCurrency must be a 3-letter code'),
];

// 路由定义

// 获取支持的货币列表
router.get(
  '/supported',
  asyncHandler(currencyController.getSupportedCurrencies.bind(currencyController))
);

// 验证货币代码
router.get(
  '/validate/:currency',
  currencyCodeValidation,
  validateRequest,
  asyncHandler(currencyController.validateCurrency.bind(currencyController))
);

// 获取汇率
router.get(
  '/exchange-rate',
  exchangeRateValidation,
  validateRequest,
  asyncHandler(currencyController.getExchangeRate.bind(currencyController))
);

// 获取汇率历史
router.get(
  '/exchange-rate/history',
  rateHistoryValidation,
  validateRequest,
  asyncHandler(currencyController.getExchangeRateHistory.bind(currencyController))
);

// 转换金额
router.post(
  '/convert',
  convertAmountValidation,
  validateRequest,
  asyncHandler(currencyController.convertAmount.bind(currencyController))
);

// 批量转换金额
router.post(
  '/convert/multiple',
  convertMultipleValidation,
  validateRequest,
  asyncHandler(currencyController.convertMultipleAmounts.bind(currencyController))
);

// 获取用户多币种汇总（需要认证）
router.get(
  '/user-summary',
  baseCurrencyValidation,
  validateRequest,
  asyncHandler(currencyController.getUserCurrencySummary.bind(currencyController))
);

export default router;