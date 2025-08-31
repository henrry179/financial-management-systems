import { useState, useEffect } from 'react';

interface MobileInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  touchSupported: boolean;
  screenSize: { width: number; height: number };
}

const useMobileOptimization = (): MobileInfo => {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'portrait',
    touchSupported: false,
    screenSize: { width: window.innerWidth, height: window.innerHeight },
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const isMobile = width <= 768;
      const isTablet = width > 768 && width <= 1024;
      const isDesktop = width > 1024;
      
      const orientation = width > height ? 'landscape' : 'portrait';
      const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setMobileInfo({
        isMobile,
        isTablet,
        isDesktop,
        orientation,
        touchSupported,
        screenSize: { width, height },
      });
    };

    // 初始检测
    checkDevice();

    // 监听窗口变化
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return mobileInfo;
};

// 移动端特定的样式工具
export const getMobileStyles = (isMobile: boolean) => {
  if (!isMobile) return {};

  return {
    // 触摸友好的按钮尺寸
    button: {
      minHeight: '44px',
      minWidth: '44px',
      fontSize: '16px',
    },
    
    // 输入框优化
    input: {
      minHeight: '44px',
      fontSize: '16px',
    },
    
    // 安全区域支持
    safeArea: {
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    },
    
    // 移动端字体大小
    typography: {
      h1: '24px',
      h2: '20px',
      h3: '18px',
      body: '16px',
      small: '14px',
    },
  };
};

// 检测iOS设备
export const isIOS = (): boolean => {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) ||
  (navigator.userAgent.includes("Mac") && "ontouchend" in document);
};

// 检测Android设备
export const isAndroid = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

// 阻止移动端默认行为（如缩放）
export const preventMobileBehaviors = () => {
  // 阻止双击缩放
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // 阻止手势缩放
  document.addEventListener('gesturestart', (event) => {
    event.preventDefault();
  });

  // 禁用文本选择（除了输入框）
  document.addEventListener('touchstart', (event) => {
    const target = event.target as HTMLElement;
    if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      event.preventDefault();
    }
  });
};

// 优化移动端滚动性能
export const optimizeMobileScroll = () => {
  // 添加触摸滚动优化
  const htmlElement = document.documentElement;
  (htmlElement.style as any).webkitOverflowScrolling = 'touch';
  
  // 优化滚动性能
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-overflow-scrolling: touch;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    
    /* 平滑滚动 */
    html {
      scroll-behavior: smooth;
    }
    
    /* 优化长列表性能 */
    .virtual-scroll-container {
      will-change: transform;
    }
  `;
  document.head.appendChild(style);
};

export default useMobileOptimization;