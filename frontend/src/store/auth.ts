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
        try {
          set({ isLoading: true });
          
          const token = localStorage.getItem('accessToken');
          
          // 演示模式：如果没有token，设置为未认证状态但不阻塞应用
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

          // 如果有token，简单验证
          const { tokens } = get();
          
          if (tokens?.accessToken === token) {
            console.log('Token found and valid, setting authenticated state');
            set({ 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            console.log('Token mismatch, clearing auth state');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({ 
              isLoading: false, 
              isAuthenticated: false,
              user: null,
              tokens: null 
            });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ 
            isLoading: false, 
            isAuthenticated: false,
            user: null,
            tokens: null 
          });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
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