import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// URL编码工具函数
export const encodeUrlPath = (path: string): string => {
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
};

export const encodeQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

// 请求拦截器
apiClient.interceptors.request.use(
  (config: any) => {
    // 获取token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 确保URL路径正确编码
    if (config.url) {
      const [basePath, queryString] = config.url.split('?');
      const encodedPath = encodeUrlPath(basePath);
      config.url = queryString ? `${encodedPath}?${queryString}` : encodedPath;
    }

    // 编码查询参数
    if (config.params) {
      config.paramsSerializer = (params: any) => encodeQueryParams(params);
    }

    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error);

    // 处理特定的错误类型
    if (error.response) {
      const { status, data } = error.response;
      
      // 处理URL编码相关的错误
      if (data?.error?.code === 'INVALID_URL_CHARACTERS' || 
          data?.error?.code === 'URL_ENCODING_ERROR') {
        console.error('URL encoding error detected. Please check request URLs.');
      }

      // 处理认证错误
      if (status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // 重定向到登录页面
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('Network error:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API接口类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// 通用API方法
export class ApiService {
  // GET请求
  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.get(url, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // POST请求
  static async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // PUT请求
  static async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.put(url, data, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // DELETE请求
  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.delete(url, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // 错误处理
  private static handleError(error: any): Error {
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      return new Error(`${apiError.code}: ${apiError.message}`);
    }
    return error;
  }
}

// 具体的API端点
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    ApiService.post('/auth/login', credentials),
  
  register: (userData: any) =>
    ApiService.post('/auth/register', userData),
  
  logout: () =>
    ApiService.post('/auth/logout'),
  
  refreshToken: () =>
    ApiService.post('/auth/refresh'),
  
  forgotPassword: (email: string) =>
    ApiService.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    ApiService.post('/auth/reset-password', { token, password }),
};

export const userApi = {
  getProfile: () =>
    ApiService.get('/users/profile'),
  
  updateProfile: (data: any) =>
    ApiService.put('/users/profile', data),
  
  getSettings: () =>
    ApiService.get('/users/settings'),
  
  updateSettings: (settings: any) =>
    ApiService.put('/users/settings', settings),
};

export const accountApi = {
  getAccounts: (params?: any) =>
    ApiService.get('/accounts', { params }),
  
  getAccount: (id: string) =>
    ApiService.get(`/accounts/${encodeURIComponent(id)}`),
  
  createAccount: (data: any) =>
    ApiService.post('/accounts', data),
  
  updateAccount: (id: string, data: any) =>
    ApiService.put(`/accounts/${encodeURIComponent(id)}`, data),
  
  deleteAccount: (id: string) =>
    ApiService.delete(`/accounts/${encodeURIComponent(id)}`),
  
  getAccountStatistics: (id: string) =>
    ApiService.get(`/accounts/${encodeURIComponent(id)}/statistics`),
};

export const transactionApi = {
  getTransactions: (params?: any) =>
    ApiService.get('/transactions', { params }),
  
  getTransaction: (id: string) =>
    ApiService.get(`/transactions/${encodeURIComponent(id)}`),
  
  createTransaction: (data: any) =>
    ApiService.post('/transactions', data),
  
  updateTransaction: (id: string, data: any) =>
    ApiService.put(`/transactions/${encodeURIComponent(id)}`, data),
  
  deleteTransaction: (id: string) =>
    ApiService.delete(`/transactions/${encodeURIComponent(id)}`),
};

export const budgetApi = {
  getBudgets: (params?: any) =>
    ApiService.get('/budgets', { params }),
  
  getBudget: (id: string) =>
    ApiService.get(`/budgets/${encodeURIComponent(id)}`),
  
  createBudget: (data: any) =>
    ApiService.post('/budgets', data),
  
  updateBudget: (id: string, data: any) =>
    ApiService.put(`/budgets/${encodeURIComponent(id)}`, data),
  
  deleteBudget: (id: string) =>
    ApiService.delete(`/budgets/${encodeURIComponent(id)}`),
};

export const reportApi = {
  getReports: (params?: any) =>
    ApiService.get('/reports', { params }),
  
  generateReport: (data: any) =>
    ApiService.post('/reports', data),
  
  getReport: (id: string) =>
    ApiService.get(`/reports/${encodeURIComponent(id)}`),
  
  exportReport: (id: string, format: string) =>
    ApiService.post(`/reports/${encodeURIComponent(id)}/export`, { format }),
};

export default ApiService;

// 导出api对象以兼容现有代码
export const api = {
  ...authApi,
  ...userApi,
  ...accountApi,
  ...transactionApi,
  ...budgetApi,
  ...reportApi,
}; 