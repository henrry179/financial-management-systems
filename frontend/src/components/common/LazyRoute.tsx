import React, { Suspense, lazy, ComponentType, ReactNode } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// 加载指示器组件
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = '正在加载...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    margin: '20px'
  }}>
    <Spin 
      indicator={<LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} spin />}
      size="large"
    />
    <div style={{ 
      marginTop: 12, 
      fontSize: 14, 
      color: '#666',
      textAlign: 'center'
    }}>
      {message}
    </div>
  </div>
);

// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyRouteErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: ReactNode }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: ReactNode }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy Route Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '300px',
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '8px',
          margin: '20px',
          padding: '20px'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h3 style={{ color: '#ff4d4f', marginBottom: 8 }}>页面加载失败</h3>
          <p style={{ color: '#666', marginBottom: 16, textAlign: 'center' }}>
            抱歉，页面加载时出现错误。请刷新页面重试。
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 懒加载路由组件工厂函数
export const createLazyRoute = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  loadingMessage?: string
) => {
  const LazyComponent = lazy(importFunc);

  const LazyRoute: React.FC<P> = (props) => (
    <LazyRouteErrorBoundary>
      <Suspense fallback={<LoadingSpinner message={loadingMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyRouteErrorBoundary>
  );

  LazyRoute.displayName = `LazyRoute(${importFunc.name || 'Component'})`;

  return LazyRoute;
};

// 预定义的懒加载路由组件
export const LazyDashboard = createLazyRoute(
  () => import('../../pages/DashboardPage'),
  '正在加载仪表板...'
);

export const LazyTransactions = createLazyRoute(
  () => import('../../pages/TransactionsPage'),
  '正在加载交易记录...'
);

export const LazyAccounts = createLazyRoute(
  () => import('../../pages/AccountsPage'),
  '正在加载账户管理...'
);

export const LazyCategories = createLazyRoute(
  () => import('../../pages/CategoriesPage'),
  '正在加载分类管理...'
);

export const LazyBudgets = createLazyRoute(
  () => import('../../pages/BudgetsPage'),
  '正在加载预算管理...'
);

export const LazyReports = createLazyRoute(
  () => import('../../pages/ReportsPage'),
  '正在加载报告分析...'
);

export const LazyBIAnalytics = createLazyRoute(
  () => import('../../pages/bi-analytics/BIAnalyticsPage'),
  '正在加载BI分析...'
);

export const LazySettings = createLazyRoute(
  () => import('../../pages/SettingsPage'),
  '正在加载系统设置...'
);

export const LazyLogin = createLazyRoute(
  () => import('../../pages/auth/LoginPage'),
  '正在加载登录页面...'
);

export const LazyRegister = createLazyRoute(
  () => import('../../pages/auth/RegisterPage'),
  '正在加载注册页面...'
);

// 路由预加载Hook
export const useRoutePreloader = () => {
  const preloadRoute = React.useCallback((importFunc: () => Promise<any>) => {
    // 在空闲时间预加载路由
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFunc().catch(console.warn);
      });
    } else {
      // 降级到setTimeout
      setTimeout(() => {
        importFunc().catch(console.warn);
      }, 100);
    }
  }, []);

  const preloadAllRoutes = React.useCallback(() => {
    const routes = [
      () => import('../../pages/DashboardPage'),
      () => import('../../pages/TransactionsPage'),
      () => import('../../pages/AccountsPage'),
      () => import('../../pages/CategoriesPage'),
      () => import('../../pages/BudgetsPage'),
      () => import('../../pages/ReportsPage'),
      () => import('../../pages/bi-analytics/BIAnalyticsPage'),
      () => import('../../pages/SettingsPage'),
    ];

    routes.forEach(preloadRoute);
  }, [preloadRoute]);

  return {
    preloadRoute,
    preloadAllRoutes,
  };
};

// 路由性能监控组件
export const RoutePerformanceMonitor: React.FC<{ routeName: string }> = ({ routeName }) => {
  const [loadTime, setLoadTime] = React.useState<number>(0);
  const [renderTime, setRenderTime] = React.useState<number>(0);

  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setLoadTime(endTime - startTime);
    };
  }, []);

  React.useEffect(() => {
    const startTime = performance.now();
    
    const measureRender = () => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
    };

    // 使用requestAnimationFrame确保DOM已渲染
    requestAnimationFrame(measureRender);
  }, []);

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      left: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '200px',
    }}>
      <div>Route Performance: {routeName}</div>
      <div>Load Time: {loadTime.toFixed(2)}ms</div>
      <div>Render Time: {renderTime.toFixed(2)}ms</div>
    </div>
  );
};
