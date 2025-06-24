import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const authController = new AuthController();

// Registration validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .isAlphanumeric()
    .withMessage('Username must be 3-20 characters long and contain only letters and numbers'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters long'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be 1-50 characters long'),
];

// Login validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Change password validation rules
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, number and special character'),
];

// Forgot password validation rules
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
];

// Reset password validation rules
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
];

// Routes
router.post(
  '/register',
  registerValidation,
  validateRequest,
  asyncHandler(authController.register.bind(authController))
);

router.post(
  '/login',
  loginValidation,
  validateRequest,
  asyncHandler(authController.login.bind(authController))
);

router.post(
  '/logout',
  asyncHandler(authController.logout.bind(authController))
);

router.post(
  '/refresh',
  asyncHandler(authController.refreshToken.bind(authController))
);

router.post(
  '/forgot-password',
  forgotPasswordValidation,
  validateRequest,
  asyncHandler(authController.forgotPassword.bind(authController))
);

router.post(
  '/reset-password',
  resetPasswordValidation,
  validateRequest,
  asyncHandler(authController.resetPassword.bind(authController))
);

router.post(
  '/change-password',
  changePasswordValidation,
  validateRequest,
  asyncHandler(authController.changePassword.bind(authController))
);

router.get(
  '/verify-email/:token',
  asyncHandler(authController.verifyEmail.bind(authController))
);

router.post(
  '/resend-verification',
  body('email').isEmail().normalizeEmail(),
  validateRequest,
  asyncHandler(authController.resendVerification.bind(authController))
);

export default router; 