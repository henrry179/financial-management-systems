import { useState, useEffect, useCallback, useRef } from 'react';
import { deviceDetector, DeviceInfo, mobileUtils } from '../utils/device';

/**
 * 移动端设备检测 Hook
 */
export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(deviceDetector.getDeviceInfo());

  useEffect(() => {
    const cleanup = deviceDetector.onResize(setDeviceInfo);
    return cleanup;
  }, []);

  return deviceInfo;
};

/**
 * 响应式断点 Hook
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'>(
    deviceDetector.getBreakpoint()
  );

  useEffect(() => {
    const cleanup = deviceDetector.onResize(() => {
      setBreakpoint(deviceDetector.getBreakpoint());
    });
    return cleanup;
  }, []);

  return breakpoint;
};

/**
 * 移动端专用 Hook
 */
export const useMobile = () => {
  const deviceInfo = useDeviceInfo();
  
  return {
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isDesktop: deviceInfo.isDesktop,
    isAndroid: deviceInfo.isAndroid,
    isIOS: deviceInfo.isIOS,
    orientation: deviceInfo.orientation,
    touchSupported: deviceInfo.touchSupported,
    ...mobileUtils,
  };
};

/**
 * 屏幕方向 Hook
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    deviceDetector.getDeviceInfo().orientation
  );

  useEffect(() => {
    const cleanup = deviceDetector.onResize((info) => {
      setOrientation(info.orientation);
    });
    return cleanup;
  }, []);

  return orientation;
};

/**
 * 触摸手势 Hook
 */
export interface TouchGestureEvents {
  onTouchStart?: (event: TouchEvent) => void;
  onTouchMove?: (event: TouchEvent) => void;
  onTouchEnd?: (event: TouchEvent) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchStart?: (scale: number) => void;
  onPinchMove?: (scale: number) => void;
  onPinchEnd?: () => void;
}

export const useTouchGesture = (
  elementRef: React.RefObject<HTMLElement>,
  events: TouchGestureEvents = {}
) => {
  const startTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const initialDistanceRef = useRef<number>(0);
  const currentScaleRef = useRef<number>(1);

  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    startTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    lastTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    // 双指缩放
    if (event.touches.length === 2) {
      initialDistanceRef.current = getDistance(event.touches[0], event.touches[1]);
      events.onPinchStart?.(currentScaleRef.current);
    }

    events.onTouchStart?.(event);
  }, [events]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!lastTouchRef.current) return;

    const touch = event.touches[0];
    lastTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    // 双指缩放
    if (event.touches.length === 2 && initialDistanceRef.current > 0) {
      const currentDistance = getDistance(event.touches[0], event.touches[1]);
      const scale = currentDistance / initialDistanceRef.current;
      currentScaleRef.current = scale;
      events.onPinchMove?.(scale);
    }

    events.onTouchMove?.(event);
  }, [events]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!startTouchRef.current || !lastTouchRef.current) return;

    const deltaX = lastTouchRef.current.x - startTouchRef.current.x;
    const deltaY = lastTouchRef.current.y - startTouchRef.current.y;
    const deltaTime = Date.now() - startTouchRef.current.time;

    // 检测滑动手势（快速滑动，时间 < 300ms，距离 > 50px）
    if (deltaTime < 300) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > 50 || absDeltaY > 50) {
        if (absDeltaX > absDeltaY) {
          // 水平滑动
          if (deltaX > 0) {
            events.onSwipeRight?.();
          } else {
            events.onSwipeLeft?.();
          }
        } else {
          // 垂直滑动
          if (deltaY > 0) {
            events.onSwipeDown?.();
          } else {
            events.onSwipeUp?.();
          }
        }
      }
    }

    // 双指缩放结束
    if (event.changedTouches.length === 2) {
      events.onPinchEnd?.();
      initialDistanceRef.current = 0;
      currentScaleRef.current = 1;
    }

    startTouchRef.current = null;
    lastTouchRef.current = null;

    events.onTouchEnd?.(event);
  }, [events]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
};

/**
 * 虚拟键盘检测 Hook（移动端）
 */
export const useVirtualKeyboard = () => {
  const [isVirtualKeyboardOpen, setIsVirtualKeyboardOpen] = useState(false);
  const initialViewportHeight = useRef(window.innerHeight);

  useEffect(() => {
    if (!deviceDetector.isMobile()) return;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight.current - currentHeight;
      
      // 如果高度减少超过150px，认为虚拟键盘打开
      setIsVirtualKeyboardOpen(heightDifference > 150);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isVirtualKeyboardOpen;
};

/**
 * 网络状态检测 Hook
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // 检测网络类型
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      setConnectionType(connection.effectiveType || connection.type || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
};

/**
 * 移动端滚动锁定 Hook
 */
export const useScrollLock = () => {
  const [isLocked, setIsLocked] = useState(false);

  const lock = useCallback(() => {
    if (!isLocked) {
      mobileUtils.preventScroll();
      setIsLocked(true);
    }
  }, [isLocked]);

  const unlock = useCallback(() => {
    if (isLocked) {
      mobileUtils.restoreScroll();
      setIsLocked(false);
    }
  }, [isLocked]);

  const toggle = useCallback(() => {
    if (isLocked) {
      unlock();
    } else {
      lock();
    }
  }, [isLocked, lock, unlock]);

  useEffect(() => {
    // 组件卸载时恢复滚动
    return () => {
      if (isLocked) {
        mobileUtils.restoreScroll();
      }
    };
  }, [isLocked]);

  return { isLocked, lock, unlock, toggle };
};

/**
 * 移动端安全区域 Hook
 */
export const useSafeArea = () => {
  const [safeAreaInsets, setSafeAreaInsets] = useState(mobileUtils.getSafeAreaInsets());

  useEffect(() => {
    const updateSafeArea = () => {
      setSafeAreaInsets(mobileUtils.getSafeAreaInsets());
    };

    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeAreaInsets;
}; 