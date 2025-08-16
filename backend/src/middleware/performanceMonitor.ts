import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { CacheService } from '../services/cacheService';

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  userId?: string;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

export interface EndpointStats {
  endpoint: string;
  method: string;
  totalRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private cache: CacheService;
  private maxMetricsSize: number = 10000;
  private slowRequestThreshold: number = 1000; // 1秒

  private constructor() {
    this.cache = CacheService.getInstance();
    this.startCleanupTask();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private startCleanupTask(): void {
    // 每小时清理一次旧指标
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000);
  }

  private cleanupOldMetrics(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    const cutoff = new Date(Date.now() - maxAge);
    
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
    
    // 如果还是太多，只保留最近的记录
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }

  public recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // 记录慢请求
    if (metric.responseTime > this.slowRequestThreshold) {
      logger.warn(`Slow request detected: ${metric.method} ${metric.endpoint} (${metric.responseTime}ms)`);
    }

    // 记录错误请求
    if (metric.statusCode >= 400) {
      logger.error(`Error request: ${metric.method} ${metric.endpoint} - ${metric.statusCode}`);
    }

    // 限制内存中的指标数量
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift();
    }
  }

  public getEndpointStats(timeWindow: number = 60 * 60 * 1000): EndpointStats[] {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    const endpointMap = new Map<string, PerformanceMetrics[]>();
    
    // 按端点分组
    for (const metric of recentMetrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, []);
      }
      endpointMap.get(key)!.push(metric);
    }

    const stats: EndpointStats[] = [];
    
    for (const [key, metrics] of endpointMap.entries()) {
      const [method, endpoint] = key.split(' ', 2);
      const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
      const errorCount = metrics.filter(m => m.statusCode >= 400).length;
      
      const p95Index = Math.floor(responseTimes.length * 0.95);
      const p99Index = Math.floor(responseTimes.length * 0.99);
      
      stats.push({
        endpoint,
        method,
        totalRequests: metrics.length,
        averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        minResponseTime: responseTimes[0] || 0,
        maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
        errorRate: (errorCount / metrics.length) * 100,
        p95ResponseTime: responseTimes[p95Index] || 0,
        p99ResponseTime: responseTimes[p99Index] || 0,
      });
    }

    return stats.sort((a, b) => b.totalRequests - a.totalRequests);
  }

  public getSlowRequests(limit: number = 20): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.responseTime > this.slowRequestThreshold)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit);
  }

  public getErrorRequests(limit: number = 20): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.statusCode >= 400)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public getSystemHealth(): {
    averageResponseTime: number;
    errorRate: number;
    requestsPerMinute: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  } {
    const recentMetrics = this.metrics.filter(
      m => m.timestamp > new Date(Date.now() - 60 * 1000) // 最近1分钟
    );

    const totalRequests = recentMetrics.length;
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);

    return {
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
      requestsPerMinute: totalRequests,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  public async generateReport(): Promise<{
    overview: ReturnType<PerformanceMonitor['getSystemHealth']>;
    topEndpoints: EndpointStats[];
    slowRequests: PerformanceMetrics[];
    errorRequests: PerformanceMetrics[];
    cacheStats: any;
  }> {
    const overview = this.getSystemHealth();
    const topEndpoints = this.getEndpointStats();
    const slowRequests = this.getSlowRequests(10);
    const errorRequests = this.getErrorRequests(10);
    const cacheStats = await this.cache.getStats();

    return {
      overview,
      topEndpoints,
      slowRequests,
      errorRequests,
      cacheStats,
    };
  }
}

// Express中间件
export function performanceMiddleware() {
  const monitor = PerformanceMonitor.getInstance();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const startCpu = process.cpuUsage();
    
    // 记录请求开始时的内存使用
    const initialMemory = process.memoryUsage();

    // 监听响应结束事件
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const endCpu = process.cpuUsage(startCpu);
      const finalMemory = process.memoryUsage();

      const metric: PerformanceMetrics = {
        endpoint: req.route?.path || req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        timestamp: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: (req as any).user?.id,
        memoryUsage: finalMemory,
        cpuUsage: endCpu,
      };

      monitor.recordMetric(metric);
    });

    next();
  };
}

// 健康检查端点
export function healthCheckHandler() {
  const monitor = PerformanceMonitor.getInstance();
  
  return async (req: Request, res: Response) => {
    try {
      const health = monitor.getSystemHealth();
      const isHealthy = health.errorRate < 5 && health.averageResponseTime < 1000;
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: health.uptime,
        memoryUsage: health.memoryUsage,
        metrics: {
          averageResponseTime: health.averageResponseTime,
          errorRate: health.errorRate,
          requestsPerMinute: health.requestsPerMinute,
        },
      });
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Unable to determine health status',
      });
    }
  };
}

// 性能报告端点
export function performanceReportHandler() {
  const monitor = PerformanceMonitor.getInstance();
  
  return async (req: Request, res: Response) => {
    try {
      const report = await monitor.generateReport();
      res.json(report);
    } catch (error) {
      logger.error('Performance report error:', error);
      res.status(500).json({
        error: 'Unable to generate performance report',
      });
    }
  };
}

// 资源使用监控
export class ResourceMonitor {
  private static instance: ResourceMonitor;
  private memoryAlerts: Array<{ timestamp: Date; usage: NodeJS.MemoryUsage }> = [];
  private cpuAlerts: Array<{ timestamp: Date; usage: number }> = [];

  public static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  public startMonitoring(interval: number = 30000): void {
    setInterval(() => {
      this.checkMemoryUsage();
      this.checkCpuUsage();
    }, interval);
  }

  private checkMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;

    if (usagePercent > 80) {
      logger.warn(`High memory usage: ${usagePercent.toFixed(2)}% (${heapUsedMB.toFixed(2)}MB)`);
      this.memoryAlerts.push({
        timestamp: new Date(),
        usage: memUsage,
      });

      // 只保留最近的50个警报
      if (this.memoryAlerts.length > 50) {
        this.memoryAlerts.shift();
      }
    }
  }

  private checkCpuUsage(): void {
    // 简化的CPU使用率检查
    const loadAvg = require('os').loadavg();
    const cpuCount = require('os').cpus().length;
    const avgLoad = loadAvg[0] / cpuCount * 100;

    if (avgLoad > 80) {
      logger.warn(`High CPU usage: ${avgLoad.toFixed(2)}%`);
      this.cpuAlerts.push({
        timestamp: new Date(),
        usage: avgLoad,
      });

      // 只保留最近的50个警报
      if (this.cpuAlerts.length > 50) {
        this.cpuAlerts.shift();
      }
    }
  }

  public getAlerts(): {
    memoryAlerts: Array<{ timestamp: Date; usage: NodeJS.MemoryUsage }>;
    cpuAlerts: Array<{ timestamp: Date; usage: number }>;
  } {
    return {
      memoryAlerts: this.memoryAlerts,
      cpuAlerts: this.cpuAlerts,
    };
  }
}