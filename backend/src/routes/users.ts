import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/userController';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const userController = new UserController();

// Profile update validation
const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters long'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be 1-50 characters long'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
];

// Settings update validation
const updateSettingsValidation = [
  body('key')
    .notEmpty()
    .withMessage('Setting key is required'),
  body('value')
    .notEmpty()
    .withMessage('Setting value is required'),
  body('category')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be 1-50 characters long'),
];

// Routes
router.get(
  '/profile',
  asyncHandler(userController.getProfile.bind(userController))
);

router.put(
  '/profile',
  updateProfileValidation,
  validateRequest,
  asyncHandler(userController.updateProfile.bind(userController))
);

router.post(
  '/upload-avatar',
  asyncHandler(userController.uploadAvatar.bind(userController))
);

router.get(
  '/settings',
  asyncHandler(userController.getSettings.bind(userController))
);

router.put(
  '/settings',
  updateSettingsValidation,
  validateRequest,
  asyncHandler(userController.updateSetting.bind(userController))
);

router.delete(
  '/settings/:key',
  asyncHandler(userController.deleteSetting.bind(userController))
);

router.get(
  '/dashboard-stats',
  asyncHandler(userController.getDashboardStats.bind(userController))
);

router.delete(
  '/account',
  asyncHandler(userController.deleteAccount.bind(userController))
);

export default router; 