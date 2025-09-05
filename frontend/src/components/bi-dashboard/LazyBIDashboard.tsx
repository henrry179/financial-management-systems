import React, { Suspense, lazy, memo } from 'react';
import { Spin, Card } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useMobile } from '../../hooks/useMobile';

// 懒加载BI看板组件
const TableauStyleDashboard = lazy(() => import('./TableauStyleDashboard'));
const PowerBIStyleDashboard = lazy(() => import('./PowerBIStyleDashboard'));
const FanRuanStyleDashboard = lazy(() => import('./FanRuanStyleDashboard'));
const GuanYuanStyleDashboard = lazy(() => import('./GuanYuanStyleDashboard'));
const MobileBIDashboard = lazy(() => import('./MobileBIDashboard'));

// 加载指示器组件
const LoadingSpinner: React.FC = memo(() => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
    backgroundColor: '#fafafa',
    borderRadius: '8px'
  }}>
    <Spin 
      indicator={<LoadingOutlined style={{ fontSize: 32, color: '#1890ff' }} spin />}
      size="large"
    />
    <div style={{ 
      marginTop: 16, 
      fontSize: 14, 
      color: '#666',
      textAlign: 'center'
    }}>
      正在加载BI看板...
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class BIErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('BI Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h3 style={{ color: '#ff4d4f', marginBottom: 8 }}>看板加载失败</h3>
          <p style={{ color: '#666', marginBottom: 16 }}>
            抱歉，BI看板加载时出现错误。请刷新页面重试。
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
        </Card>
      );
    }

    return this.props.children;
  }
}

// 懒加载BI看板选择器
interface LazyBIDashboardProps {
  selectedStyle: string;
  data?: any[];
  height?: number;
  biData?: any;
  loading?: boolean;
  onRefresh?: () => void;
  onToggleFullscreen?: () => void;
}

const LazyBIDashboard: React.FC<LazyBIDashboardProps> = memo(({
  selectedStyle,
  data = [],
  height = 400,
  biData,
  loading = false,
  onRefresh,
  onToggleFullscreen
}) => {
  const { isMobile, isTablet } = useMobile();

  // 移动端使用专门的移动端看板
  if (isMobile || isTablet) {
    return (
      <BIErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <MobileBIDashboard
            data={biData}
            loading={loading}
            onRefresh={onRefresh}
            onToggleFullscreen={onToggleFullscreen}
          />
        </Suspense>
      </BIErrorBoundary>
    );
  }

  // 桌面端根据选择的样式加载对应的看板
  const renderDashboard = () => {
    const dashboardData = biData ? biData.financialData : data;
    const commonProps = { data: dashboardData, height };

    switch (selectedStyle) {
      case 'tableau':
        return <TableauStyleDashboard {...commonProps} />;
      case 'powerbi':
        return <PowerBIStyleDashboard {...commonProps} />;
      case 'fanruan':
        return <FanRuanStyleDashboard {...commonProps} />;
      case 'guanyuan':
        return <GuanYuanStyleDashboard {...commonProps} />;
      default:
        return <TableauStyleDashboard {...commonProps} />;
    }
  };

  return (
    <BIErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        {renderDashboard()}
      </Suspense>
    </BIErrorBoundary>
  );
});

LazyBIDashboard.displayName = 'LazyBIDashboard';

export default LazyBIDashboard;
