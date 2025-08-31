import { useState, useEffect, useCallback } from 'react';

interface UseStartupProgressReturn {
  progress: number;
  status: 'loading' | 'error' | 'success';
  message: string;
  setProgress: (progress: number) => void;
  setStatus: (status: 'loading' | 'error' | 'success', message?: string) => void;
  reset: () => void;
}

const useStartupProgress = (): UseStartupProgressReturn => {
  const [progress, setProgress] = useState(0);
  const [status, setStatusState] = useState<'loading' | 'error' | 'success'>('loading');
  const [message, setMessage] = useState('正在启动财务管理系统...');

  const setStatus = useCallback((newStatus: 'loading' | 'error' | 'success', newMessage?: string) => {
    setStatusState(newStatus);
    if (newMessage) {
      setMessage(newMessage);
    } else {
      switch (newStatus) {
        case 'loading':
          setMessage('正在启动财务管理系统...');
          break;
        case 'error':
          setMessage('启动失败，请检查网络连接');
          break;
        case 'success':
          setMessage('启动完成');
          break;
      }
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setStatus('loading');
  }, [setStatus]);

  // 模拟启动进度
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 5;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [status]);

  return {
    progress,
    status,
    message,
    setProgress,
    setStatus,
    reset,
  };
};

export default useStartupProgress;