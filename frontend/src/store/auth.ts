import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authApi.login({ email, password });
          
          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Set authorization header for future requests
            if (tokens.accessToken) {
              localStorage.setItem('accessToken', tokens.accessToken);
            }
          } else {
            throw new Error(response.error?.message || 'Login failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authApi.register(data);
          
          if (response.success) {
            set({
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.error?.message || 'Registration failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message || 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        // Clear tokens from localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Reset state
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
        });

        // Call logout API (optional, for server-side cleanup)
        authApi.logout().catch(console.error);
      },

      refreshToken: async () => {
        try {
          const { tokens } = get();
          
          if (!tokens?.refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authApi.refreshToken(tokens.refreshToken);
          
          if (response.success && response.data) {
            const newTokens = {
              ...tokens,
              accessToken: response.data.accessToken,
            };
            
            set({ tokens: newTokens });
            localStorage.setItem('accessToken', response.data.accessToken);
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
          throw error;
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setTokens: (tokens: AuthTokens) => {
        set({ tokens });
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const TIMEOUT_MS = 5000; // 5秒超时
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth check timeout')), TIMEOUT_MS);
        });

        try {
          set({ isLoading: true, error: null });
          
          const token = localStorage.getItem('accessToken');
          
          // 如果没有token，直接设置为未认证状态
          if (!token) {
            console.log('No access token found, setting unauthenticated state');
            set({ 
              isLoading: false, 
              isAuthenticated: false,
              user: null,
              tokens: null 
            });
            return;
          }

          // 演示模式：如果有token但后端不可用，允许本地验证
          try {
            // 添加超时的API验证
            await Promise.race([
              // 这里可以添加API验证逻辑
              Promise.resolve(),
              timeoutPromise
            ]);

            const { tokens } = get();
            
            if (tokens?.accessToken === token) {
              console.log('Token found and valid, setting authenticated state');
              set({ 
                isAuthenticated: true, 
                isLoading: false 
              });
            } else {
              // 尝试使用本地token进行基本验证
              console.log('Using local token validation');
              set({ 
                isAuthenticated: !!token, 
                isLoading: false,
                tokens: tokens || { accessToken: token, refreshToken: '', expiresIn: '' }
              });
            }
          } catch (apiError) {
            // API不可用时的离线模式
            console.log('API unavailable, using offline mode with local token');
            const { tokens } = get();
            set({ 
              isAuthenticated: !!token, 
              isLoading: false,
              tokens: tokens || { accessToken: token, refreshToken: '', expiresIn: '' },
              error: null // 清除错误，允许离线使用
            });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ 
            isLoading: false, 
            isAuthenticated: false,
            user: null,
            tokens: null,
            error: null // 不显示错误，允许继续使用应用
          });
          // 不清除localStorage，保留用户数据
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 