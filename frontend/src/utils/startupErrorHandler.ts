import { message } from 'antd';

interface StartupError {
  type: 'network' | 'authentication' | 'timeout' | 'unknown';
  message: string;
  retryable: boolean;
  timestamp: Date;
}

class StartupErrorHandler {
  private errors: StartupError[] = [];
  private maxRetries = 3;
  private currentRetries = 0;

  logError(type: StartupError['type'], errorMessage: string, retryable = true): StartupError {
    const error: StartupError = {
      type,
      message: errorMessage,
      retryable,
      timestamp: new Date(),
    };

    this.errors.push(error);
    
    // 显示错误提示
    if (retryable) {
      message.error(`${errorMessage} (${this.currentRetries + 1}/${this.maxRetries})`);
    } else {
      message.error(errorMessage);
    }

    console.error(`[Startup Error] ${type}: ${errorMessage}`, error);
    return error;
  }

  canRetry(): boolean {
    return this.currentRetries < this.maxRetries && 
           this.errors.some(error => error.retryable);
  }

  incrementRetryCount(): void {
    this.currentRetries++;
  }

  resetRetryCount(): void {
    this.currentRetries = 0;
  }

  getErrorCount(): number {
    return this.errors.length;
  }

  getLastError(): StartupError | null {
    return this.errors.length > 0 ? this.errors[this.errors.length - 1] : null;
  }

  clearErrors(): void {
    this.errors = [];
    this.currentRetries = 0;
  }

  getErrorSummary(): {
    total: number;
    byType: Record<string, number>;
    lastError: StartupError | null;
  } {
    const byType: Record<string, number> = {};
    
    this.errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byType,
      lastError: this.getLastError(),
    };
  }

  // 特定错误类型的处理
  handleNetworkError(error: Error): StartupError {
    return this.logError('network', `网络连接失败: ${error.message}`);
  }

  handleAuthError(error: Error): StartupError {
    return this.logError('authentication', `认证失败: ${error.message}`);
  }

  handleTimeoutError(): StartupError {
    return this.logError('timeout', '请求超时，请检查网络连接');
  }

  handleUnknownError(error: Error): StartupError {
    return this.logError('unknown', `未知错误: ${error.message}`);
  }

  // 检查是否需要显示错误恢复界面
  shouldShowErrorRecovery(): boolean {
    const lastError = this.getLastError();
    if (!lastError) return false;

    // 如果是网络错误且可重试，显示恢复界面
    if (lastError.type === 'network' && lastError.retryable && this.canRetry()) {
      return true;
    }

    // 如果是认证错误，可能需要重新登录
    if (lastError.type === 'authentication') {
      return true;
    }

    return false;
  }

  // 获取错误恢复建议
  getRecoverySuggestion(): string {
    const lastError = this.getLastError();
    if (!lastError) return '';

    switch (lastError.type) {
      case 'network':
        return '请检查网络连接后重试';
      case 'authentication':
        return '请重新登录或联系管理员';
      case 'timeout':
        return '网络连接较慢，请稍后重试';
      case 'unknown':
        return '发生未知错误，请刷新页面重试';
      default:
        return '请尝试刷新页面或联系技术支持';
    }
  }
}

// 创建全局错误处理器实例
export const startupErrorHandler = new StartupErrorHandler();

// React Hook 版本
export const useStartupErrorHandler = () => {
  return {
    handleError: (type: StartupError['type'], message: string, retryable = true) => {
      return startupErrorHandler.logError(type, message, retryable);
    },
    canRetry: () => startupErrorHandler.canRetry(),
    incrementRetry: () => startupErrorHandler.incrementRetryCount(),
    reset: () => startupErrorHandler.clearErrors(),
    getErrorSummary: () => startupErrorHandler.getErrorSummary(),
  };
};