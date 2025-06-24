# 移动端适配模块使用指南

## 概述

本项目实现了完整的移动端适配方案，支持 Android 和 iOS 移动设备，提供了响应式布局、触摸友好的组件、PWA 支持等功能。

## 功能特性

### 1. 设备检测与响应式适配
- **自动设备检测**：检测移动设备、平板、桌面端
- **操作系统识别**：区分 Android、iOS、Windows 等
- **屏幕尺寸适配**：支持多种屏幕分辨率
- **方向检测**：横屏/竖屏自动适配

### 2. 移动端专用组件
- **移动端布局**：专为移动设备优化的布局组件
- **底部导航栏**：符合移动端使用习惯的导航方式
- **触摸友好按钮**：支持长按、滑动等手势
- **移动端卡片**：优化的触摸交互体验

### 3. 手势支持
- **滑动手势**：左滑、右滑、上滑、下滑
- **长按手势**：长按触发特定操作
- **双指缩放**：支持缩放操作
- **触摸反馈**：视觉和触觉反馈

### 4. PWA 支持
- **应用安装**：支持添加到主屏幕
- **离线缓存**：基本的离线功能
- **推送通知**：消息推送支持
- **快捷方式**：应用内快捷操作

## 使用方法

### 基础用法

#### 1. 设备检测

```typescript
import { useDeviceInfo, useMobile } from '@/hooks/useMobile';

function MyComponent() {
  const deviceInfo = useDeviceInfo();
  const { isMobile, isAndroid, isIOS } = useMobile();

  return (
    <div>
      {isMobile && <div>移动端布局</div>}
      {isAndroid && <div>Android 特定功能</div>}
      {isIOS && <div>iOS 特定功能</div>}
    </div>
  );
}
```

#### 2. 响应式布局

```typescript
import ResponsiveLayout from '@/components/common/ResponsiveLayout';

function App() {
  return (
    <ResponsiveLayout>
      {/* 内容会根据设备类型自动选择布局 */}
      <YourContent />
    </ResponsiveLayout>
  );
}
```

#### 3. 移动端组件

```typescript
import {
  MobileTouchButton,
  MobileCard,
  MobileSearch,
  MobileListItem
} from '@/components/mobile/MobileComponents';

function MobilePage() {
  return (
    <div>
      {/* 触摸友好的按钮 */}
      <MobileTouchButton 
        type="primary"
        onClick={() => console.log('点击')}
        onLongPress={() => console.log('长按')}
      >
        操作按钮
      </MobileTouchButton>

      {/* 支持滑动手势的卡片 */}
      <MobileCard
        title="卡片标题"
        onSwipeLeft={() => console.log('左滑')}
        onSwipeRight={() => console.log('右滑')}
      >
        卡片内容
      </MobileCard>

      {/* 移动端搜索框 */}
      <MobileSearch
        placeholder="搜索..."
        onSearch={(value) => console.log('搜索:', value)}
      />

      {/* 列表项 */}
      <MobileListItem
        title="列表项标题"
        description="描述信息"
        onSwipeLeft={() => console.log('左滑删除')}
        onClick={() => console.log('点击查看')}
      />
    </div>
  );
}
```

#### 4. 手势处理

```typescript
import { useTouchGesture } from '@/hooks/useMobile';
import { useRef } from 'react';

function GestureComponent() {
  const elementRef = useRef<HTMLDivElement>(null);

  useTouchGesture(elementRef, {
    onSwipeLeft: () => console.log('左滑'),
    onSwipeRight: () => console.log('右滑'),
    onSwipeUp: () => console.log('上滑'),
    onSwipeDown: () => console.log('下滑'),
    onPinchStart: (scale) => console.log('开始缩放', scale),
    onPinchMove: (scale) => console.log('缩放中', scale),
    onPinchEnd: () => console.log('缩放结束'),
  });

  return (
    <div ref={elementRef} style={{ width: 200, height: 200 }}>
      触摸区域
    </div>
  );
}
```

### 高级用法

#### 1. 自定义断点

```typescript
import { useBreakpoint } from '@/hooks/useMobile';

function ResponsiveComponent() {
  const breakpoint = useBreakpoint();

  const getColumns = () => {
    switch (breakpoint) {
      case 'xs': return 1;
      case 'sm': return 2;
      case 'md': return 3;
      case 'lg': return 4;
      default: return 4;
    }
  };

  return (
    <div style={{ columns: getColumns() }}>
      响应式内容
    </div>
  );
}
```

#### 2. 虚拟键盘检测

```typescript
import { useVirtualKeyboard } from '@/hooks/useMobile';

function FormComponent() {
  const isKeyboardOpen = useVirtualKeyboard();

  return (
    <div style={{
      paddingBottom: isKeyboardOpen ? '20px' : '60px'
    }}>
      <input type="text" placeholder="输入内容" />
    </div>
  );
}
```

#### 3. 网络状态监听

```typescript
import { useNetworkStatus } from '@/hooks/useMobile';

function NetworkComponent() {
  const { isOnline, connectionType } = useNetworkStatus();

  return (
    <div>
      <div>网络状态: {isOnline ? '在线' : '离线'}</div>
      <div>连接类型: {connectionType}</div>
    </div>
  );
}
```

#### 4. 滚动锁定

```typescript
import { useScrollLock } from '@/hooks/useMobile';

function ModalComponent({ visible }) {
  const { lock, unlock } = useScrollLock();

  useEffect(() => {
    if (visible) {
      lock(); // 锁定背景滚动
    } else {
      unlock(); // 恢复滚动
    }
  }, [visible, lock, unlock]);

  return visible ? <div>模态框内容</div> : null;
}
```

## 样式系统

### CSS 类名规范

```css
/* 移动端隐藏 */
.mobile-hidden { display: none; }

/* 桌面端隐藏 */
.desktop-hidden { display: block; }

/* 触摸反馈 */
.touch-feedback { transition: background-color 0.1s ease; }

/* 安全区域 */
.safe-area-top { padding-top: env(safe-area-inset-top); }
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-area-left { padding-left: env(safe-area-inset-left); }
.safe-area-right { padding-right: env(safe-area-inset-right); }
```

### 响应式断点

```css
/* 手机 */
@media (max-width: 768px) { ... }

/* 小屏手机 */
@media (max-width: 480px) { ... }

/* 横屏手机 */
@media (max-width: 768px) and (orientation: landscape) { ... }

/* 平板 */
@media (min-width: 769px) and (max-width: 1024px) { ... }

/* 桌面 */
@media (min-width: 1025px) { ... }
```

## PWA 配置

### 应用清单

项目已配置 `manifest.json`，支持：
- 添加到主屏幕
- 全屏显示
- 主题色配置
- 图标适配
- 启动画面

### 安装提示

```typescript
// 检测 PWA 安装提示
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // 显示自定义安装按钮
});

// 触发安装
const installApp = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    console.log('安装结果:', result);
    deferredPrompt = null;
  }
};
```

## 性能优化

### 1. 懒加载
```typescript
import { lazy, Suspense } from 'react';

const MobileComponent = lazy(() => import('./MobileComponent'));

function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <MobileComponent />
    </Suspense>
  );
}
```

### 2. 图片优化
```typescript
// 根据设备像素比选择图片
const getImageSrc = (baseSrc: string) => {
  const pixelRatio = window.devicePixelRatio || 1;
  return pixelRatio > 1 ? `${baseSrc}@2x.png` : `${baseSrc}.png`;
};
```

### 3. 防抖优化
```typescript
import { debounce } from 'lodash-es';

const debouncedSearch = debounce((value: string) => {
  // 搜索逻辑
}, 300);
```

## 最佳实践

### 1. 触摸目标尺寸
- 最小触摸目标：44px × 44px
- 建议触摸目标：48px × 48px
- 重要按钮：≥ 56px × 56px

### 2. 字体大小
- 最小字体：14px（iOS Safari 不缩放）
- 主要内容：16px
- 标题文字：18px+

### 3. 间距设计
- 最小间距：8px
- 标准间距：16px
- 大间距：24px
- 区块间距：32px

### 4. 加载状态
```typescript
// 提供明确的加载状态
function LoadingComponent() {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <div>加载中...</div>
    </div>
  );
}
```

### 5. 错误处理
```typescript
// 移动端友好的错误提示
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="error-container">
        <div>出错了，请稍后重试</div>
        <button onClick={() => setHasError(false)}>
          重新加载
        </button>
      </div>
    );
  }

  return children;
}
```

## 测试指南

### 1. 设备测试
- iPhone（Safari、Chrome）
- Android（Chrome、三星浏览器）
- iPad（Safari）
- 各种屏幕尺寸

### 2. 功能测试
- 触摸交互
- 手势识别
- 屏幕旋转
- 虚拟键盘
- PWA 安装

### 3. 性能测试
- 首屏加载时间
- 交互响应时间
- 内存使用情况
- 电池消耗

## 故障排除

### 常见问题

1. **iOS Safari 缩放问题**
   ```css
   input { font-size: 16px !important; }
   ```

2. **Android 点击延迟**
   ```css
   * { touch-action: manipulation; }
   ```

3. **iOS 弹性滚动**
   ```css
   body { -webkit-overflow-scrolling: touch; }
   ```

4. **安全区域适配**
   ```css
   .container {
     padding: env(safe-area-inset-top) env(safe-area-inset-right) 
              env(safe-area-inset-bottom) env(safe-area-inset-left);
   }
   ```

### 调试工具

1. **Chrome DevTools**
   - 设备模拟器
   - 网络节流
   - 性能分析

2. **Safari Web Inspector**
   - iOS 设备调试
   - 内存分析
   - 网络监控

3. **移动端调试**
   ```javascript
   // 移动端控制台
   import eruda from 'eruda';
   if (process.env.NODE_ENV === 'development') {
     eruda.init();
   }
   ```

## 更新日志

### v1.0.0
- 初始版本发布
- 支持 Android 和 iOS 设备检测
- 实现响应式布局组件
- 添加触摸手势支持
- 配置 PWA 功能

## 贡献指南

1. 提交 Issue 描述问题或建议
2. Fork 项目并创建功能分支
3. 编写测试用例
4. 提交 Pull Request

## 许可证

MIT License 