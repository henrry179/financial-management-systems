import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { EmailService } from '../services/emailService';

export class AuthController {
  private emailService = new EmailService();

  async register(req: Request, res: Response) {
    const { email, username, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: existingUser.email === email ? 'Email already registered' : 'Username already taken',
        },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Generate verification token
    const verificationToken = uuidv4();
    
    // Store verification token (in production, use Redis or database)
    // For now, we'll create a simple token that expires in 24 hours
    const verificationPayload = {
      userId: user.id,
      email: user.email,
      type: 'email_verification',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    const verificationJWT = jwt.sign(verificationPayload, process.env.JWT_SECRET!);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, verificationJWT);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      data: {
        user,
        message: 'Registration successful. Please check your email to verify your account.',
      },
    });
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    // 临时演示用户 - 用于测试登录界面
    const demoUsers = [
      {
        id: 'demo-1',
        email: 'admin@financial.com',
        password: 'admin123456',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        isVerified: true,
        isActive: true,
      },
      {
        id: 'demo-2', 
        email: 'user@financial.com',
        password: 'user123456',
        username: 'user',
        firstName: 'Demo',
        lastName: 'User',
        isVerified: true,
        isActive: true,
      }
    ];

    // 查找演示用户
    const demoUser = demoUsers.find(user => user.email === email && user.password === password);

    if (demoUser) {
      // 生成演示token
      const accessToken = this.generateAccessToken(demoUser.id);
      const refreshToken = this.generateRefreshToken(demoUser.id);

      res.json({
        success: true,
        data: {
          user: {
            id: demoUser.id,
            email: demoUser.email,
            username: demoUser.username,
            firstName: demoUser.firstName,
            lastName: demoUser.lastName,
            avatar: demoUser.avatar,
            isVerified: demoUser.isVerified,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
          },
        },
      });
      return;
    }

    // 如果没有找到演示用户，尝试数据库查询
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Your account has been disabled',
          },
        });
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      // Update last login (optional)
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            isVerified: user.isVerified,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
          },
        },
      });
    } catch (error) {
      console.error('Database error during login:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection error. Please try again later.',
        },
      });
    }
  }

  async logout(req: Request, res: Response) {
    // In a production app, you'd invalidate the token in Redis/database
    // For now, we'll just return success (client should remove token)
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token is required',
        },
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid refresh token',
          },
        });
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user.id);

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token',
        },
      });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetPayload = {
      userId: user.id,
      email: user.email,
      type: 'password_reset',
      token: resetToken,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    };

    const resetJWT = jwt.sign(resetPayload, process.env.JWT_SECRET!);

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetJWT);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.',
    });
  }

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RESET_TOKEN',
            message: 'Invalid or expired reset token',
          },
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESET_TOKEN',
          message: 'Invalid or expired reset token',
        },
      });
    }
  }

  async changePassword(req: AuthRequest, res: Response) {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is incorrect',
        },
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }

  async verifyEmail(req: Request, res: Response) {
    const { token } = req.params;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }

      // Update user verification status
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { isVerified: true },
      });

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VERIFICATION_TOKEN',
          message: 'Invalid or expired verification token',
        },
      });
    }
  }

  async resendVerification(req: Request, res: Response) {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a verification link.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email is already verified',
        },
      });
    }

    // Generate new verification token
    const verificationPayload = {
      userId: user.id,
      email: user.email,
      type: 'email_verification',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    const verificationJWT = jwt.sign(verificationPayload, process.env.JWT_SECRET!);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, verificationJWT);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a verification link.',
    });
  }

  private generateAccessToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
    );
  }
} 