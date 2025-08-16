/**
 * Service Worker for Financial Management System PWA
 * 提供离线缓存、后台同步、推送通知等功能
 */

const CACHE_NAME = 'financial-app-v1.0.0';
const STATIC_CACHE = 'financial-static-v1';
const DYNAMIC_CACHE = 'financial-dynamic-v1';
const API_CACHE = 'financial-api-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // 核心CSS和JS文件将在运行时添加
];

// 需要缓存的API路径
const API_ENDPOINTS = [
  '/api/auth/user',
  '/api/dashboard/summary',
  '/api/transactions/recent',
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // 立即激活新的Service Worker
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 删除旧版本缓存
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 立即控制所有页面
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求和API请求
  if (url.origin !== location.origin && !url.pathname.startsWith('/api/')) {
    return;
  }

  // API请求 - 网络优先策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  }
  // 静态资源 - 缓存优先策略
  else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
  }
  // 页面请求 - 网络优先，离线时返回缓存
  else {
    event.respondWith(handlePageRequest(request));
  }
});

// 处理API请求 - 网络优先，支持离线
async function handleApiRequest(request) {
  const cacheName = API_CACHE;
  
  try {
    // 尝试网络请求
    const networkResponse = await fetch(request);
    
    // 成功时缓存响应（仅GET请求）
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败时从缓存返回
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // 添加离线标识头
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From', 'cache');
      return response;
    }
    
    // 如果是关键API且无缓存，返回离线提示
    if (isCriticalApi(request.url)) {
      return new Response(
        JSON.stringify({
          error: 'offline',
          message: '当前处于离线状态，请稍后重试'
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// 处理静态资源请求 - 缓存优先
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 静态资源失败时可以返回默认资源
    if (request.destination === 'image') {
      return caches.match('/icons/icon-192x192.png');
    }
    throw error;
  }
}

// 处理页面请求 - 网络优先
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 离线时返回缓存的页面
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回离线页面
    return caches.match('/offline.html') || 
           caches.match('/index.html') ||
           new Response('离线状态，请检查网络连接', {
             status: 503,
             statusText: 'Service Unavailable'
           });
  }
}

// 判断是否为静态资源
function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname.includes('/static/') ||
         url.pathname.includes('/assets/');
}

// 判断是否为关键API
function isCriticalApi(url) {
  const criticalEndpoints = [
    '/api/auth/',
    '/api/dashboard/',
    '/api/transactions/'
  ];
  
  return criticalEndpoints.some(endpoint => url.includes(endpoint));
}

// 监听来自主线程的消息
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_RESOURCES':
      cacheResources(payload.urls);
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    case 'SYNC_DATA':
      // 后台数据同步
      handleBackgroundSync(payload);
      break;
  }
});

// 缓存指定资源
async function cacheResources(urls) {
  if (!Array.isArray(urls)) return;
  
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.addAll(urls);
    console.log('Resources cached successfully');
  } catch (error) {
    console.error('Failed to cache resources:', error);
  }
}

// 清理所有缓存
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

// 后台同步处理
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'financial-data-sync':
      event.waitUntil(syncFinancialData());
      break;
      
    case 'transaction-upload':
      event.waitUntil(uploadPendingTransactions());
      break;
  }
});

// 同步财务数据
async function syncFinancialData() {
  try {
    // 获取需要同步的数据
    const pendingData = await getStoredPendingData();
    
    if (pendingData.length > 0) {
      for (const data of pendingData) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
      
      // 清理已同步的数据
      await clearPendingData();
      console.log('Financial data synced successfully');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// 上传待处理的交易
async function uploadPendingTransactions() {
  try {
    const transactions = await getStoredTransactions();
    
    for (const transaction of transactions) {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      
      if (response.ok) {
        await removeStoredTransaction(transaction.id);
      }
    }
  } catch (error) {
    console.error('Transaction upload failed:', error);
  }
}

// 推送通知处理
self.addEventListener('push', (event) => {
  const options = {
    body: '您有新的财务提醒',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: '查看详情',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/icons/xmark.png'
      }
    ]
  };

  if (event.data) {
    const notificationData = event.data.json();
    options.body = notificationData.message || options.body;
    options.data = { ...options.data, ...notificationData };
  }

  event.waitUntil(
    self.registration.showNotification('财务管理系统', options)
  );
});

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // 打开应用到指定页面
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // 只关闭通知
    event.notification.close();
  } else {
    // 默认行为：打开应用
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// IndexedDB 辅助函数（用于离线数据存储）
async function getStoredPendingData() {
  // 实现 IndexedDB 数据获取
  return [];
}

async function clearPendingData() {
  // 实现 IndexedDB 数据清理
}

async function getStoredTransactions() {
  // 实现 IndexedDB 交易数据获取
  return [];
}

async function removeStoredTransaction(id) {
  // 实现 IndexedDB 交易数据删除
}

console.log('Service Worker loaded successfully');