import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp } from 'antd';
import { useAuthStore } from './store/auth';
import { deviceDetector, mobileUtils } from './utils/device';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ResponsiveLayout from './components/common/ResponsiveLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Business Pages
import TransactionsPage from './pages/transactions/TransactionsPage';
import { BIAnalyticsPage } from './pages/bi-analytics';
import DashboardPage from './pages/DashboardPage';

// Dashboard Pages - Placeholder components
const AccountsPage = () => <div>账户管理页面</div>;
const CategoriesPage = () => <div>分类管理页面</div>;
const BudgetsPage = () => <div>预算管理页面</div>;
const ReportsPage = () => <div>报告分析页面</div>;
const SettingsPage = () => <div>系统设置页面</div>;
const ProfilePage = () => <div>个人资料页面</div>;
const ForgotPasswordPage = () => <div>忘记密码页面</div>;
const ResetPasswordPage = () => <div>重置密码页面</div>;
const VerifyEmailPage = () => <div>邮箱验证页面</div>;

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // 移动端初始化设置
  useEffect(() => {
    const deviceInfo = deviceDetector.getDeviceInfo();
    
    // 移动端优化
    if (deviceInfo.isMobile) {
      // 设置视口元标签
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );

      // 设置状态栏样式（iOS PWA）
      mobileUtils.setStatusBarStyle('default');

      // 添加安全区域样式变量
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --sat: env(safe-area-inset-top);
          --sar: env(safe-area-inset-right);
          --sab: env(safe-area-inset-bottom);
          --sal: env(safe-area-inset-left);
        }
      `;
      document.head.appendChild(style);

      // 禁用双击缩放
      document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
          event.preventDefault();
        }
      }, { passive: false });

      let lastTouchEnd = 0;
      document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      }, { passive: false });

      // 隐藏地址栏
      setTimeout(() => {
        mobileUtils.hideAddressBar();
      }, 100);
    }
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AntApp>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Protected Dashboard Routes with Responsive Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <ResponsiveLayout />
          </ProtectedRoute>
        }>
          <Route index element={<BIAnalyticsPage />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Redirect unauthenticated users to login */}
        <Route path="*" element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/auth/login" replace />
          )
        } />
      </Routes>
    </AntApp>
  );
}

export default App; 