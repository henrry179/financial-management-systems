import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ReportController } from '../controllers/reportController';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const reportController = new ReportController();

// Report generation validation
const generateReportValidation = [
  body('type')
    .isIn(['MONTHLY_SUMMARY', 'EXPENSE_ANALYSIS', 'INCOME_ANALYSIS', 'BUDGET_PERFORMANCE', 'TREND_ANALYSIS', 'CUSTOM'])
    .withMessage('Invalid report type'),
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Report title must be 1-200 characters long'),
  body('period')
    .isLength({ min: 1, max: 50 })
    .withMessage('Period is required'),
  body('parameters')
    .optional()
    .isObject()
    .withMessage('Parameters must be an object'),
  body('format')
    .optional()
    .isIn(['JSON', 'PDF', 'EXCEL'])
    .withMessage('Format must be JSON, PDF, or EXCEL'),
];

// UUID param validation
const uuidParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid report ID'),
];

// Query validation for filtering
const filterValidation = [
  query('type')
    .optional()
    .isIn(['MONTHLY_SUMMARY', 'EXPENSE_ANALYSIS', 'INCOME_ANALYSIS', 'BUDGET_PERFORMANCE', 'TREND_ANALYSIS', 'CUSTOM'])
    .withMessage('Invalid report type'),
  query('period')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Period must be 1-50 characters long'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Routes - 只保留 controller 中实际存在的方法
router.get(
  '/',
  filterValidation,
  validateRequest,
  asyncHandler(reportController.getReports.bind(reportController))
);

router.post(
  '/generate',
  generateReportValidation,
  validateRequest,
  asyncHandler(reportController.generateReport.bind(reportController))
);

// 注释掉不存在的方法
/*
router.get(
  '/templates',
  asyncHandler(reportController.getReportTemplates.bind(reportController))
);

router.get(
  '/monthly-summary',
  query('year').isInt({ min: 2000, max: 3000 }).withMessage('Year is required'),
  query('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  validateRequest,
  asyncHandler(reportController.generateMonthlySummary.bind(reportController))
);

router.get(
  '/expense-analysis',
  query('startDate').isISO8601().withMessage('Start date is required'),
  query('endDate').isISO8601().withMessage('End date is required'),
  validateRequest,
  asyncHandler(reportController.generateExpenseAnalysis.bind(reportController))
);

router.get(
  '/income-analysis',
  query('startDate').isISO8601().withMessage('Start date is required'),
  query('endDate').isISO8601().withMessage('End date is required'),
  validateRequest,
  asyncHandler(reportController.generateIncomeAnalysis.bind(reportController))
);

router.get(
  '/budget-performance',
  query('period').optional().isIn(['month', 'quarter', 'year']),
  validateRequest,
  asyncHandler(reportController.generateBudgetPerformance.bind(reportController))
);

router.get(
  '/trend-analysis',
  query('period').isIn(['week', 'month', 'quarter', 'year']).withMessage('Period is required'),
  query('metrics').optional().isArray().withMessage('Metrics must be an array'),
  validateRequest,
  asyncHandler(reportController.generateTrendAnalysis.bind(reportController))
);
*/

router.get(
  '/:id',
  uuidParamValidation,
  validateRequest,
  asyncHandler(reportController.getReport.bind(reportController))
);

router.delete(
  '/:id',
  uuidParamValidation,
  validateRequest,
  asyncHandler(reportController.deleteReport.bind(reportController))
);

// 注释掉不存在的方法
/*
router.get(
  '/:id/download',
  uuidParamValidation,
  validateRequest,
  asyncHandler(reportController.downloadReport.bind(reportController))
);

router.post(
  '/:id/share',
  uuidParamValidation,
  validateRequest,
  asyncHandler(reportController.shareReport.bind(reportController))
);

router.post(
  '/:id/export',
  uuidParamValidation,
  body('format').isIn(['PDF', 'EXCEL']).withMessage('Format must be PDF or EXCEL'),
  validateRequest,
  asyncHandler(reportController.exportReport.bind(reportController))
);
*/

export default router; 