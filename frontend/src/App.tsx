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

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  // 初始化认证状态检查
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 如果正在加载认证状态，显示加载器
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f0f2f5'
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
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
  );
}

export default App; 