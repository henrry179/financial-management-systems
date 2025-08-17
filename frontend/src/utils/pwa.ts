import { useState, useEffect } from 'react';

/**
 * PWA (Progressive Web App) 工具类
 * 提供应用安装、更新检测、离线处理等PWA功能
 */

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAUpdateInfo {
  isUpdateAvailable: boolean;
  skipWaiting: () => void;
  reload: () => void;
}

export class PWAManager {
  private static instance: PWAManager;
  private deferredPrompt: PWAInstallPrompt | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private updateCallbacks: Set<(info: PWAUpdateInfo) => void> = new Set();
  private installCallbacks: Set<(canInstall: boolean) => void> = new Set();

  private constructor() {
    this.init();
  }

  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  private async init() {
    // 监听安装提示事件
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as any;
      this.notifyInstallCallbacks(true);
    });

    // 监听应用安装事件
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.notifyInstallCallbacks(false);
      console.log('PWA was installed successfully');
    });

    // 注册 Service Worker
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');

        // 监听更新
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 有新版本可用
                this.notifyUpdateCallbacks({
                  isUpdateAvailable: true,
                  skipWaiting: () => {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  },
                  reload: () => window.location.reload()
                });
              }
            });
          }
        });

        // 监听控制权变更
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // 检查是否可以安装
  public canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  // 检查是否已安装
  public isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // 触发安装提示
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  // 订阅安装状态变化
  public onInstallAvailable(callback: (canInstall: boolean) => void): () => void {
    this.installCallbacks.add(callback);
    // 立即通知当前状态
    callback(this.canInstall());
    
    return () => {
      this.installCallbacks.delete(callback);
    };
  }

  // 订阅更新通知
  public onUpdateAvailable(callback: (info: PWAUpdateInfo) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  // 检查网络状态
  public isOnline(): boolean {
    return navigator.onLine;
  }

  // 获取网络信息
  public getNetworkInfo(): { 
    isOnline: boolean; 
    effectiveType?: string; 
    downlink?: number; 
    rtt?: number; 
  } {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    return {
      isOnline: this.isOnline(),
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  }

  // 缓存关键资源
  public async cacheResources(urls: string[]): Promise<void> {
    if ('caches' in window) {
      const cache = await caches.open('app-cache-v1');
      await cache.addAll(urls);
    }
  }

  // 获取缓存的资源
  public async getCachedResource(url: string): Promise<Response | undefined> {
    if ('caches' in window) {
      return await caches.match(url);
    }
    return undefined;
  }

  // 清理缓存
  public async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }

  // 设置应用徽章（如果支持）
  public async setBadge(count: number): Promise<void> {
    if ('setAppBadge' in navigator) {
      try {
        await (navigator as any).setAppBadge(count);
      } catch (error) {
        console.warn('Badge API not supported:', error);
      }
    }
  }

  // 清除应用徽章
  public async clearBadge(): Promise<void> {
    if ('clearAppBadge' in navigator) {
      try {
        await (navigator as any).clearAppBadge();
      } catch (error) {
        console.warn('Badge API not supported:', error);
      }
    }
  }

  // 显示通知
  public async showNotification(
    title: string, 
    options?: NotificationOptions
  ): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      if (this.registration) {
        await this.registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options,
        });
      } else {
        new Notification(title, options);
      }
    }
  }

  // 请求通知权限
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  // 分享内容（Web Share API）
  public async share(shareData: ShareData): Promise<boolean> {
    if ('share' in navigator) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        console.warn('Share failed:', error);
        return false;
      }
    }
    return false;
  }

  // 获取设备信息
  public getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
    };
  }

  private notifyInstallCallbacks(canInstall: boolean) {
    this.installCallbacks.forEach(callback => callback(canInstall));
  }

  private notifyUpdateCallbacks(info: PWAUpdateInfo) {
    this.updateCallbacks.forEach(callback => callback(info));
  }
}

// 导出单例实例
export const pwaManager = PWAManager.getInstance();

// React Hook
export const usePWA = () => {
  const [canInstall, setCanInstall] = useState(pwaManager.canInstall());
  const [isInstalled] = useState(pwaManager.isInstalled());
  const [updateInfo, setUpdateInfo] = useState<PWAUpdateInfo | null>(null);
  const [networkInfo, setNetworkInfo] = useState(pwaManager.getNetworkInfo());

  useEffect(() => {
    // 订阅安装状态
    const unsubscribeInstall = pwaManager.onInstallAvailable(setCanInstall);
    
    // 订阅更新通知
    const unsubscribeUpdate = pwaManager.onUpdateAvailable(setUpdateInfo);

    // 监听网络状态变化
    const updateNetworkInfo = () => setNetworkInfo(pwaManager.getNetworkInfo());
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      unsubscribeInstall();
      unsubscribeUpdate();
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return {
    canInstall,
    isInstalled,
    updateInfo,
    networkInfo,
    install: pwaManager.promptInstall.bind(pwaManager),
    showNotification: pwaManager.showNotification.bind(pwaManager),
    requestNotificationPermission: pwaManager.requestNotificationPermission.bind(pwaManager),
    share: pwaManager.share.bind(pwaManager),
    setBadge: pwaManager.setBadge.bind(pwaManager),
    clearBadge: pwaManager.clearBadge.bind(pwaManager),
  };
};