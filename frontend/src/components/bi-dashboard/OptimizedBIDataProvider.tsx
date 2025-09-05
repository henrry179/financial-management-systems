import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useCache, useDebounce, useThrottle } from '../../hooks/usePerformance';
import { BIApiService, MockBIDataGenerator, BIReportData } from '../../services/biApi';
import { useAuthStore } from '../../store/auth';

// 缓存键常量
const CACHE_KEYS = {
  BI_DATA: 'bi-report-data',
  USER_BI_DATA: (userId: string) => `bi-report-data-${userId}`,
} as const;

// 缓存时间常量（毫秒）
const CACHE_TTL = {
  BI_DATA: 2 * 60 * 1000, // 2分钟
  USER_BI_DATA: 5 * 60 * 1000, // 5分钟
} as const;

// 上下文类型
interface BIDataContextType {
  data: BIReportData | null;
  loading: boolean;
  error: Error | null;
  useRealData: boolean;
  setUseRealData: (useReal: boolean) => void;
  refresh: () => Promise<void>;
  clearCache: () => void;
  lastUpdated: string | null;
}

// 创建上下文
const BIDataContext = createContext<BIDataContextType | null>(null);

// 提供者组件属性
interface OptimizedBIDataProviderProps {
  children: ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultUseRealData?: boolean;
}

// 优化的BI数据提供者组件
export const OptimizedBIDataProvider: React.FC<OptimizedBIDataProviderProps> = ({
  children,
  autoRefresh = false,
  refreshInterval = 60000, // 1分钟
  defaultUseRealData = false,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [useRealData, setUseRealData] = React.useState(defaultUseRealData);

  // 防抖的useRealData状态
  const debouncedUseRealData = useDebounce(useRealData, 300);

  // 生成缓存键
  const cacheKey = useMemo(() => {
    if (isAuthenticated && user?.id) {
      return CACHE_KEYS.USER_BI_DATA(user.id);
    }
    return CACHE_KEYS.BI_DATA;
  }, [isAuthenticated, user?.id]);

  // 生成缓存TTL
  const cacheTTL = useMemo(() => {
    if (isAuthenticated && user?.id) {
      return CACHE_TTL.USER_BI_DATA;
    }
    return CACHE_TTL.BI_DATA;
  }, [isAuthenticated, user?.id]);

  // 数据获取函数
  const fetchBIData = useCallback(async (): Promise<BIReportData> => {
    if (debouncedUseRealData) {
      try {
        const response = await BIApiService.getBIReportData();
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error?.message || 'Failed to fetch real API data');
        }
      } catch (error) {
        console.warn('Failed to fetch real data, falling back to mock data:', error);
        // 如果真实数据获取失败，回退到模拟数据
        return MockBIDataGenerator.generateBIReportData();
      }
    } else {
      // 使用模拟数据
      return MockBIDataGenerator.generateBIReportData();
    }
  }, [debouncedUseRealData]);

  // 使用缓存Hook
  const {
    data,
    loading,
    error,
    refetch,
    clearCache,
  } = useCache(cacheKey, fetchBIData, cacheTTL);

  // 节流的刷新函数
  const throttledRefresh = useThrottle(refetch, 1000);

  // 手动刷新函数
  const refresh = useCallback(async () => {
    try {
      await throttledRefresh();
    } catch (error) {
      console.error('Failed to refresh BI data:', error);
    }
  }, [throttledRefresh]);

  // 清除缓存函数
  const handleClearCache = useCallback(() => {
    clearCache();
  }, [clearCache]);

  // 自动刷新
  React.useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!loading) {
        refresh();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading, refresh]);

  // 当useRealData变化时，清除缓存并重新获取数据
  React.useEffect(() => {
    if (debouncedUseRealData !== useRealData) {
      clearCache();
    }
  }, [debouncedUseRealData, useRealData, clearCache]);

  // 上下文值
  const contextValue = useMemo<BIDataContextType>(() => ({
    data,
    loading,
    error,
    useRealData: debouncedUseRealData,
    setUseRealData,
    refresh,
    clearCache: handleClearCache,
    lastUpdated: data?.lastUpdated || null,
  }), [
    data,
    loading,
    error,
    debouncedUseRealData,
    setUseRealData,
    refresh,
    handleClearCache,
  ]);

  return (
    <BIDataContext.Provider value={contextValue}>
      {children}
    </BIDataContext.Provider>
  );
};

// 使用BI数据的Hook
export const useBIData = (): BIDataContextType => {
  const context = useContext(BIDataContext);
  if (!context) {
    throw new Error('useBIData must be used within an OptimizedBIDataProvider');
  }
  return context;
};

// 优化的BI数据消费者组件
interface OptimizedBIDataConsumerProps {
  children: (context: BIDataContextType) => ReactNode;
}

export const OptimizedBIDataConsumer: React.FC<OptimizedBIDataConsumerProps> = ({
  children,
}) => {
  const context = useBIData();
  return <>{children(context)}</>;
};

// 性能监控组件
export const BIDataPerformanceMonitor: React.FC = () => {
  const { data, loading, lastUpdated } = useBIData();
  const [renderCount, setRenderCount] = React.useState(0);

  React.useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '200px',
    }}>
      <div>BI Data Performance</div>
      <div>Render Count: {renderCount}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Data Points: {data?.financialData?.length || 0}</div>
      <div>Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}</div>
      <div>Cache Key: {data ? 'Cached' : 'Not Cached'}</div>
    </div>
  );
};

// 数据预加载组件
export const BIDataPreloader: React.FC = () => {
  const { refresh } = useBIData();

  // 在组件挂载时预加载数据
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return null;
};

// 导出类型
export type { BIDataContextType, OptimizedBIDataProviderProps, OptimizedBIDataConsumerProps };
