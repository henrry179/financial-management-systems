/**
 * 设备检测工具
 * 检测设备类型、操作系统、屏幕尺寸等
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
  touchSupported: boolean;
}

export class DeviceDetector {
  private static instance: DeviceDetector;
  private deviceInfo: DeviceInfo;

  private constructor() {
    this.deviceInfo = this.detectDevice();
  }

  public static getInstance(): DeviceDetector {
    if (!DeviceDetector.instance) {
      DeviceDetector.instance = new DeviceDetector();
    }
    return DeviceDetector.instance;
  }

  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth || document.documentElement.clientWidth;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight;

    // 设备类型检测
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                     screenWidth <= 768;
    const isTablet = /ipad|android/i.test(userAgent) && screenWidth > 768 && screenWidth <= 1024;
    const isDesktop = !isMobile && !isTablet;

    // 操作系统检测
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);

    // 浏览器检测
    const isChrome = /chrome/i.test(userAgent) && !/edge/i.test(userAgent);
    const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent);
    const isFirefox = /firefox/i.test(userAgent);

    // 屏幕方向
    const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

    // 设备像素比
    const devicePixelRatio = window.devicePixelRatio || 1;

    // 触摸支持检测
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      isMobile,
      isTablet,
      isDesktop,
      isAndroid,
      isIOS,
      isChrome,
      isSafari,
      isFirefox,
      screenWidth,
      screenHeight,
      orientation,
      devicePixelRatio,
      touchSupported,
    };
  }

  public getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  public isMobile(): boolean {
    return this.deviceInfo.isMobile;
  }

  public isTablet(): boolean {
    return this.deviceInfo.isTablet;
  }

  public isDesktop(): boolean {
    return this.deviceInfo.isDesktop;
  }

  public isAndroid(): boolean {
    return this.deviceInfo.isAndroid;
  }

  public isIOS(): boolean {
    return this.deviceInfo.isIOS;
  }

  public getBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' {
    const width = this.deviceInfo.screenWidth;
    if (width < 576) return 'xs';
    if (width < 768) return 'sm';
    if (width < 992) return 'md';
    if (width < 1200) return 'lg';
    if (width < 1600) return 'xl';
    return 'xxl';
  }

  public updateDeviceInfo(): void {
    this.deviceInfo = this.detectDevice();
  }

  // 监听屏幕尺寸变化
  public onResize(callback: (deviceInfo: DeviceInfo) => void): () => void {
    const handleResize = () => {
      this.updateDeviceInfo();
      callback(this.getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 返回清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }
}

// 导出单例实例
export const deviceDetector = DeviceDetector.getInstance();

// 便捷的 hooks
export const useDeviceDetector = () => {
  return deviceDetector;
};

// 响应式断点常量
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
} as const;

// 移动端专用工具函数
export const mobileUtils = {
  // 禁用页面缩放
  disableZoom: () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }
  },

  // 启用页面缩放
  enableZoom: () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0'
      );
    }
  },

  // 隐藏地址栏（移动端）
  hideAddressBar: () => {
    if (deviceDetector.isMobile()) {
      window.scrollTo(0, 1);
    }
  },

  // 防止页面滚动（通常用于模态框）
  preventScroll: () => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  },

  // 恢复页面滚动
  restoreScroll: () => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  },

  // 获取安全区域信息（iOS刘海屏等）
  getSafeAreaInsets: () => {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseFloat(style.getPropertyValue('--sat') || '0'),
      right: parseFloat(style.getPropertyValue('--sar') || '0'),
      bottom: parseFloat(style.getPropertyValue('--sab') || '0'),
      left: parseFloat(style.getPropertyValue('--sal') || '0'),
    };
  },

  // 设置状态栏样式（PWA）
  setStatusBarStyle: (style: 'default' | 'black' | 'black-translucent') => {
    let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!statusBarMeta) {
      statusBarMeta = document.createElement('meta');
      statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(statusBarMeta);
    }
    statusBarMeta.setAttribute('content', style);
  },
}; 