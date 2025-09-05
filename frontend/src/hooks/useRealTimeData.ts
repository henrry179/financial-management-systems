import { useState, useEffect, useCallback, useRef } from 'react';
import { BIApiService, BIReportData } from '../services/biApi';
import { message } from 'antd';

interface UseRealTimeDataOptions {
  interval?: number; // 刷新间隔（毫秒）
  autoRefresh?: boolean; // 是否自动刷新
  onDataUpdate?: (data: BIReportData) => void; // 数据更新回调
  onError?: (error: Error) => void; // 错误回调
}

export const useRealTimeData = (options: UseRealTimeDataOptions = {}) => {
  const {
    interval = 30000, // 默认30秒刷新一次
    autoRefresh = true,
    onDataUpdate,
    onError
  } = options;

  const [data, setData] = useState<BIReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // 获取数据
  const fetchData = useCallback(async (showMessage = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await BIApiService.getBIReportData();
      
      if (response.success && response.data) {
        setData(response.data);
        setLastUpdate(new Date());
        setIsConnected(true);
        retryCountRef.current = 0;

        if (showMessage) {
          message.success('数据已更新');
        }

        onDataUpdate?.(response.data);
      } else {
        throw new Error(response.error?.message || '数据获取失败');
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      retryCountRef.current++;

      if (retryCountRef.current >= maxRetries) {
        setIsConnected(false);
        message.error('数据连接失败，请检查网络');
      }

      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [onDataUpdate, onError]);

  // 手动刷新
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // 重置连接状态
  const resetConnection = useCallback(() => {
    setIsConnected(true);
    retryCountRef.current = 0;
    fetchData();
  }, [fetchData]);

  // 设置自动刷新
  useEffect(() => {
    if (autoRefresh && interval > 0) {
      intervalRef.current = setInterval(() => {
        if (isConnected) {
          fetchData();
        }
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, interval, fetchData, isConnected]);

  // 组件挂载时获取初始数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdate,
    isConnected,
    refresh,
    resetConnection,
    // 计算属性
    timeSinceUpdate: lastUpdate ? Date.now() - lastUpdate.getTime() : null,
    isStale: lastUpdate ? Date.now() - lastUpdate.getTime() > interval * 2 : false,
  };
};

export default useRealTimeData;
