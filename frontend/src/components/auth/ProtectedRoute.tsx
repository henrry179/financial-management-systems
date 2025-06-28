import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // 如果正在加载，显示加载器
  if (isLoading) {
    return <LoadingSpinner tip="验证身份中..." />;
  }

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // 已认证，显示内容
  return <>{children}</>;
};

export default ProtectedRoute; 