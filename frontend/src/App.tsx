import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Dashboard Pages
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import AccountsPage from './pages/accounts/AccountsPage';
import BudgetsPage from './pages/budgets/BudgetsPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import ReportsPage from './pages/reports/ReportsPage';
import BIAnalyticsPage from './pages/bi-analytics/BIAnalyticsPage';
import SettingsPage from './pages/settings/SettingsPage';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import { AuthProvider } from './components/auth/AuthProvider';
import StartupScreen from './components/startup/StartupScreen';

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const {
    isStarting,
    progress,
    status: startupStatus,
    error: startupError,
    retryStartup,
  } = useSystemStartup();

  // 防止无限加载的安全机制
  const [maxLoadingReached, setMaxLoadingReached] = React.useState(false);

  // 初始化认证状态检查
  useEffect(() => {
    checkAuth();
    
    // 设置最大加载时间（15秒）
    const loadingTimer = setTimeout(() => {
      console.warn('Maximum loading time reached, forcing app to load');
      setMaxLoadingReached(true);
    }, 15000);

    return () => clearTimeout(loadingTimer);
  }, [checkAuth]);

  // 如果系统正在启动或认证加载中，显示增强的启动界面
  if (isStarting || (isLoading && !maxLoadingReached)) {
    return (
      <StartupScreen
        progress={progress}
        status={
          startupStatus === 'error' ? 'error' : 
          startupStatus === 'ready' ? 'success' : 'loading'
        }
        message={
          startupError || 
          (isStarting ? '正在启动财务管理系统...' : '正在检查认证状态...')
        }
        onRetry={startupStatus === 'error' ? retryStartup : undefined}
        theme="light"
      />
    );
  }

  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes - Auth */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes - Dashboard */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="bi-analytics" element={<BIAnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Root redirect */}
        <Route path="*" element={
          isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <Navigate to="/auth/login" replace />
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App; 