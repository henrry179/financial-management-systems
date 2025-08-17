import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { CacheService } from './cacheService';

export interface QueryMetrics {
  queryId: string;
  sql: string;
  executionTime: number;
  rowsAffected: number;
  timestamp: Date;
  userId?: string;
}

export interface IndexSuggestion {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImprovement: number; // 百分比
}

export interface PerformanceReport {
  totalQueries: number;
  averageExecutionTime: number;
  slowQueries: QueryMetrics[];
  indexSuggestions: IndexSuggestion[];
  cacheHitRate: number;
  timestamp: Date;
}

export class QueryOptimizationService {
  private static instance: QueryOptimizationService;
  private prisma: PrismaClient;
  private cache: CacheService;
  private queryMetrics: Map<string, QueryMetrics[]> = new Map();
  private slowQueryThreshold: number = 1000; // 1秒

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cache = CacheService.getInstance();
    this.setupQueryLogging();
  }

  public static getInstance(prisma?: PrismaClient): QueryOptimizationService {
    if (!QueryOptimizationService.instance) {
      if (!prisma) {
        throw new Error('Prisma client is required for first initialization');
      }
      QueryOptimizationService.instance = new QueryOptimizationService(prisma);
    }
    return QueryOptimizationService.instance;
  }

  private setupQueryLogging(): void {
    // 使用Prisma的查询事件监听
    this.prisma.$on('query' as never, (e: any) => {
      this.recordQueryMetrics({
        queryId: this.generateQueryId(e.query),
        sql: e.query,
        executionTime: e.duration,
        rowsAffected: 0, // Prisma不直接提供这个信息
        timestamp: new Date(),
      });
    });
  }

  private generateQueryId(sql: string): string {
    // 生成查询的唯一标识
    return require('crypto')
      .createHash('md5')
      .update(sql.replace(/\$\d+/g, '?')) // 标准化参数
      .digest('hex')
      .substring(0, 8);
  }

  private recordQueryMetrics(metrics: QueryMetrics): void {
    const { queryId } = metrics;
    
    if (!this.queryMetrics.has(queryId)) {
      this.queryMetrics.set(queryId, []);
    }
    
    const queries = this.queryMetrics.get(queryId)!;
    queries.push(metrics);
    
    // 只保留最近1000条记录
    if (queries.length > 1000) {
      queries.splice(0, queries.length - 1000);
    }
    
    // 记录慢查询
    if (metrics.executionTime > this.slowQueryThreshold) {
      logger.warn(`Slow query detected: ${metrics.sql} (${metrics.executionTime}ms)`);
    }
  }

  // 优化的查询方法
  public async findWithCache<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    const result = await queryFn();
    const executionTime = Date.now() - startTime;

    // 记录查询指标
    this.recordQueryMetrics({
      queryId: this.generateQueryId(key),
      sql: key,
      executionTime,
      rowsAffected: Array.isArray(result) ? result.length : 1,
      timestamp: new Date(),
    });

    await this.cache.set(key, result, { ttl });
    return result;
  }

  // 批量查询优化
  public async batchFind<T, K>(
    items: K[],
    keyFn: (item: K) => string,
    queryFn: (items: K[]) => Promise<T[]>,
    ttl: number = 300
  ): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    const uncachedItems: K[] = [];
    const uncachedKeys: string[] = [];

    // 检查缓存
    for (const item of items) {
      const key = keyFn(item);
      const cached = await this.cache.get<T>(key);
      if (cached) {
        result.set(key, cached);
      } else {
        uncachedItems.push(item);
        uncachedKeys.push(key);
      }
    }

    // 批量查询未缓存的数据
    if (uncachedItems.length > 0) {
      const startTime = Date.now();
      const queryResults = await queryFn(uncachedItems);
      const executionTime = Date.now() - startTime;

      // 记录查询指标
      this.recordQueryMetrics({
        queryId: this.generateQueryId(`batch_${uncachedKeys.join(',')}`),
        sql: `Batch query for ${uncachedItems.length} items`,
        executionTime,
        rowsAffected: queryResults.length,
        timestamp: new Date(),
      });

      // 缓存结果
      const cachePromises = queryResults.map((item, index) => {
        const key = uncachedKeys[index];
        result.set(key, item);
        return this.cache.set(key, item, { ttl });
      });

      await Promise.all(cachePromises);
    }

    return result;
  }

  // 分页查询优化
  public async paginatedFind<T>(
    baseKey: string,
    page: number,
    limit: number,
    queryFn: (offset: number, limit: number) => Promise<{ data: T[]; total: number }>,
    ttl: number = 300
  ): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const cacheKey = `${baseKey}:page:${page}:limit:${limit}`;

    const cached = await this.cache.get<{ data: T[]; total: number }>(cacheKey);
    if (cached) {
      return {
        ...cached,
        page,
        totalPages: Math.ceil(cached.total / limit),
      };
    }

    const startTime = Date.now();
    const result = await queryFn(offset, limit);
    const executionTime = Date.now() - startTime;

    // 记录查询指标
    this.recordQueryMetrics({
      queryId: this.generateQueryId(cacheKey),
      sql: `Paginated query: ${baseKey}`,
      executionTime,
      rowsAffected: result.data.length,
      timestamp: new Date(),
    });

    await this.cache.set(cacheKey, result, { ttl });

    return {
      ...result,
      page,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  // 获取慢查询
  public getSlowQueries(limit: number = 20): QueryMetrics[] {
    const allQueries: QueryMetrics[] = [];
    
    for (const queries of this.queryMetrics.values()) {
      allQueries.push(...queries);
    }

    return allQueries
      .filter(q => q.executionTime > this.slowQueryThreshold)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  // 分析查询模式
  public analyzeQueryPatterns(): {
    mostFrequentQueries: Array<{ queryId: string; count: number; avgTime: number }>;
    queryDistribution: { [key: string]: number };
  } {
    const frequencyMap = new Map<string, { count: number; totalTime: number }>();

    for (const [queryId, queries] of this.queryMetrics.entries()) {
      const totalTime = queries.reduce((sum, q) => sum + q.executionTime, 0);
      frequencyMap.set(queryId, {
        count: queries.length,
        totalTime,
      });
    }

    const mostFrequentQueries = Array.from(frequencyMap.entries())
      .map(([queryId, stats]) => ({
        queryId,
        count: stats.count,
        avgTime: stats.totalTime / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const queryDistribution: { [key: string]: number } = {};
    for (const [queryId, stats] of frequencyMap.entries()) {
      const category = this.categorizeQuery(queryId);
      queryDistribution[category] = (queryDistribution[category] || 0) + stats.count;
    }

    return { mostFrequentQueries, queryDistribution };
  }

  private categorizeQuery(queryId: string): string {
    // 基于查询ID或SQL语句对查询进行分类
    if (queryId.includes('transaction')) return 'transactions';
    if (queryId.includes('user')) return 'users';
    if (queryId.includes('account')) return 'accounts';
    if (queryId.includes('category')) return 'categories';
    if (queryId.includes('report')) return 'reports';
    return 'other';
  }

  // 生成索引建议
  public generateIndexSuggestions(): IndexSuggestion[] {
    const suggestions: IndexSuggestion[] = [];
    const patterns = this.analyzeQueryPatterns();

    // 基于查询频率和执行时间生成索引建议
    for (const query of patterns.mostFrequentQueries) {
      if (query.avgTime > 500) { // 平均执行时间超过500ms
        const suggestion = this.generateIndexSuggestionForQuery(query.queryId);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  }

  private generateIndexSuggestionForQuery(queryId: string): IndexSuggestion | null {
    // 基于查询ID生成索引建议的简化逻辑
    if (queryId.includes('transaction')) {
      return {
        table: 'Transaction',
        columns: ['userId', 'createdAt'],
        type: 'btree',
        reason: 'Frequent user transaction queries with date filtering',
        estimatedImprovement: 40,
      };
    }

    if (queryId.includes('user')) {
      return {
        table: 'User',
        columns: ['email'],
        type: 'btree',
        reason: 'Frequent user lookup by email',
        estimatedImprovement: 60,
      };
    }

    return null;
  }

  // 生成性能报告
  public async generatePerformanceReport(): Promise<PerformanceReport> {
    const allQueries: QueryMetrics[] = [];
    for (const queries of this.queryMetrics.values()) {
      allQueries.push(...queries);
    }

    const totalQueries = allQueries.length;
    const averageExecutionTime = totalQueries > 0 
      ? allQueries.reduce((sum, q) => sum + q.executionTime, 0) / totalQueries
      : 0;

    const slowQueries = this.getSlowQueries(10);
    const indexSuggestions = this.generateIndexSuggestions();
    const cacheStats = await this.cache.getStats();

    return {
      totalQueries,
      averageExecutionTime: Math.round(averageExecutionTime * 100) / 100,
      slowQueries,
      indexSuggestions,
      cacheHitRate: cacheStats.hitRate,
      timestamp: new Date(),
    };
  }

  // 清理旧的查询指标
  public cleanupOldMetrics(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [queryId, queries] of this.queryMetrics.entries()) {
      const filtered = queries.filter(q => q.timestamp > cutoff);
      if (filtered.length === 0) {
        this.queryMetrics.delete(queryId);
      } else {
        this.queryMetrics.set(queryId, filtered);
      }
    }
  }

  // 设置慢查询阈值
  public setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold;
  }

  // 获取查询统计
  public getQueryStats(): {
    totalUniqueQueries: number;
    totalExecutions: number;
    averageExecutionTime: number;
    slowQueryCount: number;
  } {
    let totalExecutions = 0;
    let totalTime = 0;
    let slowQueryCount = 0;

    for (const queries of this.queryMetrics.values()) {
      totalExecutions += queries.length;
      for (const query of queries) {
        totalTime += query.executionTime;
        if (query.executionTime > this.slowQueryThreshold) {
          slowQueryCount++;
        }
      }
    }

    return {
      totalUniqueQueries: this.queryMetrics.size,
      totalExecutions,
      averageExecutionTime: totalExecutions > 0 ? totalTime / totalExecutions : 0,
      slowQueryCount,
    };
  }
}