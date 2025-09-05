import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../auth';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { login } = useAuthStore.getState();
      
      await login('test@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Invalid credentials' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      });

      const { login } = useAuthStore.getState();
      
      await login('test@example.com', 'wrongpassword');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should handle network error during login', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { login } = useAuthStore.getState();
      
      await login('test@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('register', () => {
    it('should handle successful registration', async () => {
      const mockUser = {
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
      };

      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { register } = useAuthStore.getState();
      
      await register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password',
        firstName: 'New',
        lastName: 'User',
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle registration failure', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Email already exists' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      });

      const { register } = useAuthStore.getState();
      
      await register({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password',
        firstName: 'Existing',
        lastName: 'User',
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      // Set some initial state
      useAuthStore.setState({
        user: { id: '1', username: 'test', email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
      });

      const { logout } = useAuthStore.getState();
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('checkAuth', () => {
    it('should restore auth state from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'accessToken') return 'stored-access-token';
        if (key === 'refreshToken') return 'stored-refresh-token';
        if (key === 'user') return JSON.stringify({ id: '1', username: 'storeduser' });
        return null;
      });

      const { checkAuth } = useAuthStore.getState();
      checkAuth();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('stored-access-token');
      expect(state.refreshToken).toBe('stored-refresh-token');
      expect(state.user).toEqual({ id: '1', username: 'storeduser' });
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle missing tokens in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { checkAuth } = useAuthStore.getState();
      checkAuth();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should handle successful token refresh', async () => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Set initial refresh token
      useAuthStore.setState({ refreshToken: 'old-refresh-token' });

      const { refreshToken } = useAuthStore.getState();
      const result = await refreshToken();

      expect(result).toBe(true);
      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');
    });

    it('should handle token refresh failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Refresh failed'));

      useAuthStore.setState({ refreshToken: 'invalid-refresh-token' });

      const { refreshToken } = useAuthStore.getState();
      const result = await refreshToken();

      expect(result).toBe(false);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });
});
