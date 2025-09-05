import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * 防抖Hook
 * @param value 需要防抖的值
 * @param delay 延迟时间（毫秒）
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * 节流Hook
 * @param callback 需要节流的回调函数
 * @param delay 延迟时间（毫秒）
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: any[]) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

/**
 * 虚拟化列表Hook
 * @param items 列表项
 * @param itemHeight 每项高度
 * @param containerHeight 容器高度
 */
export const useVirtualization = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      items: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
  };
};

/**
 * 图片懒加载Hook
 * @param src 图片源地址
 * @param placeholder 占位符
 */
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setIsError(false);
    };
    
    img.onerror = () => {
      setIsError(true);
      setIsLoaded(false);
    };
    
    img.src = src;
  }, [src]);

  return {
    imageSrc,
    isLoaded,
    isError,
    imgRef,
  };
};

/**
 * 性能监控Hook
 */
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
  });

  const measureRenderTime = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
      }));
      
      if (renderTime > 16) { // 超过16ms（60fps）
        console.warn(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, []);

  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
      }));
    }
  }, []);

  const measureFPS = useCallback(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measure = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measure);
    };
    
    requestAnimationFrame(measure);
  }, []);

  useEffect(() => {
    measureMemoryUsage();
    measureFPS();
    
    const interval = setInterval(measureMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, [measureMemoryUsage, measureFPS]);

  return {
    metrics,
    measureRenderTime,
    measureMemoryUsage,
  };
};

/**
 * 缓存Hook
 * @param key 缓存键
 * @param fetcher 数据获取函数
 * @param ttl 缓存时间（毫秒）
 */
export const useCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 默认5分钟
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const getCachedData = useCallback(async () => {
    const cached = cacheRef.current.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < ttl) {
      setData(cached.data);
      return cached.data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheRef.current.set(key, { data: result, timestamp: now });
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  const clearCache = useCallback(() => {
    cacheRef.current.delete(key);
    setData(null);
  }, [key]);

  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
    setData(null);
  }, []);

  useEffect(() => {
    getCachedData();
  }, [getCachedData]);

  return {
    data,
    loading,
    error,
    refetch: getCachedData,
    clearCache,
    clearAllCache,
  };
};

/**
 * 批量更新Hook
 * @param updates 更新函数数组
 * @param delay 批量更新延迟
 */
export const useBatchUpdates = <T>(
  updates: Array<(prev: T) => T>,
  delay: number = 16
) => {
  const [state, setState] = useState<T>({} as T);
  const updatesRef = useRef<Array<(prev: T) => T>>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((update: (prev: T) => T) => {
    updatesRef.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prev => {
        let newState = prev;
        updatesRef.current.forEach(updateFn => {
          newState = updateFn(newState);
        });
        updatesRef.current = [];
        return newState;
      });
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate] as const;
};

/**
 * 资源预加载Hook
 * @param resources 需要预加载的资源列表
 */
export const usePreload = (resources: string[]) => {
  const [loadedResources, setLoadedResources] = useState<Set<string>>(new Set());
  const [loadingResources, setLoadingResources] = useState<Set<string>>(new Set());

  const preloadResource = useCallback(async (url: string) => {
    if (loadedResources.has(url) || loadingResources.has(url)) {
      return;
    }

    setLoadingResources(prev => new Set(prev).add(url));

    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      
      if (url.endsWith('.css')) {
        link.as = 'style';
      } else if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        link.as = 'image';
      } else if (url.match(/\.(js|mjs)$/)) {
        link.as = 'script';
      }

      document.head.appendChild(link);

      await new Promise((resolve, reject) => {
        link.onload = () => resolve(undefined);
        link.onerror = reject;
      });

      setLoadedResources(prev => new Set(prev).add(url));
    } catch (error) {
      console.warn(`Failed to preload resource: ${url}`, error);
    } finally {
      setLoadingResources(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    }
  }, [loadedResources, loadingResources]);

  const preloadAll = useCallback(async () => {
    await Promise.allSettled(resources.map(preloadResource));
  }, [resources, preloadResource]);

  useEffect(() => {
    preloadAll();
  }, [preloadAll]);

  return {
    loadedResources,
    loadingResources,
    preloadResource,
    preloadAll,
  };
};
