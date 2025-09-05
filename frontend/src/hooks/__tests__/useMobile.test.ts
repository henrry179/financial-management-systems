import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMobile, useOrientation, useTouchGesture, useNetworkStatus } from '../useMobile';

// Mock device detector
vi.mock('../../utils/device', () => ({
  deviceDetector: {
    getDeviceInfo: vi.fn(() => ({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isAndroid: false,
      isIOS: false,
      screenWidth: 1920,
      screenHeight: 1080,
      orientation: 'landscape',
      devicePixelRatio: 1,
      touchSupported: false,
    })),
    getBreakpoint: vi.fn(() => 'xl'),
    onResize: vi.fn(() => vi.fn()), // Return cleanup function
    isMobile: vi.fn(() => false),
  },
  mobileUtils: {
    preventScroll: vi.fn(),
    restoreScroll: vi.fn(),
    getSafeAreaInsets: vi.fn(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
  },
}));

describe('useMobile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return device information', () => {
    const { result } = renderHook(() => useMobile());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isAndroid).toBe(false);
    expect(result.current.isIOS).toBe(false);
    expect(result.current.orientation).toBe('landscape');
    expect(result.current.touchSupported).toBe(false);
  });

  it('should handle mobile device detection', () => {
    const { deviceDetector } = require('../../utils/device');
    deviceDetector.getDeviceInfo.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isAndroid: true,
      isIOS: false,
      screenWidth: 375,
      screenHeight: 667,
      orientation: 'portrait',
      devicePixelRatio: 2,
      touchSupported: true,
    });

    const { result } = renderHook(() => useMobile());
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isAndroid).toBe(true);
    expect(result.current.orientation).toBe('portrait');
    expect(result.current.touchSupported).toBe(true);
  });
});

describe('useOrientation', () => {
  it('should return current orientation', () => {
    const { result } = renderHook(() => useOrientation());
    
    expect(result.current).toBe('landscape');
  });

  it('should update orientation on change', () => {
    const { deviceDetector } = require('../../utils/device');
    let resizeCallback: (info: any) => void;
    
    deviceDetector.onResize.mockImplementation((callback: (info: any) => void) => {
      resizeCallback = callback;
      return vi.fn(); // cleanup function
    });

    const { result } = renderHook(() => useOrientation());
    
    expect(result.current).toBe('landscape');

    // Simulate orientation change
    act(() => {
      resizeCallback({ orientation: 'portrait' });
    });

    expect(result.current).toBe('portrait');
  });
});

describe('useTouchGesture', () => {
  it('should handle touch events', () => {
    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    const elementRef = { current: mockElement as any };
    const events = {
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
    };

    renderHook(() => useTouchGesture(elementRef, events));

    expect(mockElement.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
    expect(mockElement.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
    expect(mockElement.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
  });

  it('should detect swipe gestures', () => {
    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    const elementRef = { current: mockElement as any };
    const events = {
      onSwipeLeft: vi.fn(),
      onSwipeRight: vi.fn(),
    };

    renderHook(() => useTouchGesture(elementRef, events));

    // Get the event handlers
    const touchStartHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchstart'
    )?.[1];
    const touchEndHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchend'
    )?.[1];

    // Simulate swipe left
    act(() => {
      touchStartHandler({
        touches: [{ clientX: 100, clientY: 100 }],
      });
    });

    act(() => {
      touchEndHandler({
        changedTouches: [{ clientX: 50, clientY: 100 }],
      });
    });

    expect(events.onSwipeLeft).toHaveBeenCalled();
  });

  it('should handle pinch gestures', () => {
    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    const elementRef = { current: mockElement as any };
    const events = {
      onPinchStart: vi.fn(),
      onPinchMove: vi.fn(),
      onPinchEnd: vi.fn(),
    };

    renderHook(() => useTouchGesture(elementRef, events));

    const touchStartHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchstart'
    )?.[1];
    const touchMoveHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchmove'
    )?.[1];
    const touchEndHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === 'touchend'
    )?.[1];

    // Simulate pinch start
    act(() => {
      touchStartHandler({
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 100 }
        ],
      });
    });

    expect(events.onPinchStart).toHaveBeenCalled();

    // Simulate pinch move
    act(() => {
      touchMoveHandler({
        touches: [
          { clientX: 90, clientY: 100 },
          { clientX: 210, clientY: 100 }
        ],
      });
    });

    expect(events.onPinchMove).toHaveBeenCalled();

    // Simulate pinch end
    act(() => {
      touchEndHandler({
        changedTouches: [
          { clientX: 90, clientY: 100 },
          { clientX: 210, clientY: 100 }
        ],
      });
    });

    expect(events.onPinchEnd).toHaveBeenCalled();
  });
});

describe('useNetworkStatus', () => {
  beforeEach(() => {
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('should return online status', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.connectionType).toBe('unknown');
  });

  it('should handle offline event', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should handle online event', () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(false);

    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should detect connection type when available', () => {
    // Mock connection API
    const mockConnection = {
      effectiveType: '4g',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: mockConnection,
    });

    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.connectionType).toBe('4g');
  });
});
