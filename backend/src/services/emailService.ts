import * as nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@financial.com',
      to: email,
      subject: '邮箱验证 - 智能财务管理系统',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1890ff;">欢迎注册智能财务管理系统！</h2>
          <p>感谢您注册我们的财务管理系统。请点击下面的链接验证您的邮箱地址：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              验证邮箱
            </a>
          </div>
          <p style="color: #666;">如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
          <p style="word-break: break-all; color: #1890ff;">${verificationUrl}</p>
          <p style="color: #999; font-size: 12px;">
            此链接将在24小时后过期。如果您没有注册账户，请忽略此邮件。
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent to:', email);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@financial.com',
      to: email,
      subject: '密码重置 - 智能财务管理系统',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff4d4f;">密码重置请求</h2>
          <p>我们收到了您的密码重置请求。请点击下面的链接重置您的密码：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #ff4d4f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              重置密码
            </a>
          </div>
          <p style="color: #666;">如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
          <p style="word-break: break-all; color: #ff4d4f;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px;">
            此链接将在1小时后过期。如果您没有请求重置密码，请忽略此邮件，您的账户将保持安全。
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent to:', email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@financial.com',
      to: email,
      subject: '欢迎使用智能财务管理系统',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #52c41a;">欢迎 ${name}！</h2>
          <p>恭喜您成功注册智能财务管理系统！</p>
          <p>您现在可以开始使用以下功能：</p>
          <ul style="line-height: 1.8;">
            <li>📊 智能记账和分类管理</li>
            <li>📈 数据可视化分析</li>
            <li>📋 财务报告生成</li>
            <li>🎯 预算管理和提醒</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
               style="background-color: #52c41a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              开始使用
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            如有任何问题，请联系我们的客服团队。祝您使用愉快！
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent to:', email);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }
} 