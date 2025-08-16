import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl?: number; // 默认TTL（秒）
}

export interface CacheOptions {
  ttl?: number; // 过期时间（秒）
  tags?: string[]; // 缓存标签，用于批量清理
  compress?: boolean; // 是否压缩
}

export class CacheService {
  private static instance: CacheService;
  private client: RedisClientType;
  private isConnected: boolean = false;
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  private constructor(config: CacheConfig) {
    this.defaultTTL = config.ttl || 3600; // 默认1小时
    this.keyPrefix = 'finance:';
    
    this.client = createClient({
      socket: {
        host: config.host,
        port: config.port,
      },
      password: config.password,
      database: config.db || 0,
    }) as RedisClientType;

    this.setupEventHandlers();
  }

  public static getInstance(config?: CacheConfig): CacheService {
    if (!CacheService.instance) {
      if (!config) {
        throw new Error('Cache configuration is required for first initialization');
      }
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.info('Redis client disconnected');
      this.isConnected = false;
    });
  }

  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
      }
    } catch (error) {
      logger.error('Failed to disconnect from Redis:', error);
    }
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  // 基础缓存操作
  public async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;
      
      const fullKey = this.getKey(key);
      const value = await this.client.get(fullKey);
      
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  public async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      const fullKey = this.getKey(key);
      const ttl = options?.ttl || this.defaultTTL;
      const serializedValue = JSON.stringify(value);
      
      await this.client.setEx(fullKey, ttl, serializedValue);
      
      // 如果有标签，添加到标签集合
      if (options?.tags) {
        await this.addToTags(key, options.tags);
      }
      
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      const fullKey = this.getKey(key);
      const result = await this.client.del(fullKey);
      
      return result > 0;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      const fullKey = this.getKey(key);
      const result = await this.client.exists(fullKey);
      
      return result > 0;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // 高级缓存操作
  public async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (!this.isConnected) return keys.map(() => null);
      
      const fullKeys = keys.map(key => this.getKey(key));
      const values = await this.client.mGet(fullKeys);
      
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  public async mset<T>(pairs: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      const pipeline = this.client.multi();
      
      for (const { key, value, ttl } of pairs) {
        const fullKey = this.getKey(key);
        const serializedValue = JSON.stringify(value);
        const expiration = ttl || this.defaultTTL;
        
        pipeline.setEx(fullKey, expiration, serializedValue);
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  // 标签管理
  private async addToTags(key: string, tags: string[]): Promise<void> {
    const pipeline = this.client.multi();
    
    for (const tag of tags) {
      const tagKey = this.getKey(`tag:${tag}`);
      pipeline.sAdd(tagKey, key);
    }
    
    await pipeline.exec();
  }

  public async clearByTags(tags: string[]): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      
      let totalCleared = 0;
      
      for (const tag of tags) {
        const tagKey = this.getKey(`tag:${tag}`);
        const members = await this.client.sMembers(tagKey);
        
        if (members.length > 0) {
          const fullKeys = members.map(key => this.getKey(key));
          const deletedCount = await this.client.del(fullKeys);
          totalCleared += deletedCount;
          
          // 清理标签集合
          await this.client.del(tagKey);
        }
      }
      
      return totalCleared;
    } catch (error) {
      logger.error('Cache clear by tags error:', error);
      return 0;
    }
  }

  // 缓存统计
  public async getStats(): Promise<{
    memory: string;
    keys: number;
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    try {
      if (!this.isConnected) {
        return { memory: '0B', keys: 0, hits: 0, misses: 0, hitRate: 0 };
      }
      
      const info = await this.client.info('memory');
      const stats = await this.client.info('stats');
      
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memory = memoryMatch ? memoryMatch[1] : '0B';
      
      const hitsMatch = stats.match(/keyspace_hits:(\d+)/);
      const missesMatch = stats.match(/keyspace_misses:(\d+)/);
      
      const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
      const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
      const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;
      
      const keys = await this.client.dbSize();
      
      return {
        memory,
        keys,
        hits,
        misses,
        hitRate: Math.round(hitRate * 100) / 100,
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return { memory: '0B', keys: 0, hits: 0, misses: 0, hitRate: 0 };
    }
  }

  // 缓存清理
  public async flushAll(): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error('Cache flush all error:', error);
      return false;
    }
  }

  // 分布式锁
  public async acquireLock(lockKey: string, ttl: number = 30): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      
      const lockId = `${Date.now()}-${Math.random()}`;
      const fullKey = this.getKey(`lock:${lockKey}`);
      
      const result = await this.client.set(fullKey, lockId, {
        EX: ttl,
        NX: true,
      });
      
      return result === 'OK' ? lockId : null;
    } catch (error) {
      logger.error(`Lock acquire error for ${lockKey}:`, error);
      return null;
    }
  }

  public async releaseLock(lockKey: string, lockId: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      const fullKey = this.getKey(`lock:${lockKey}`);
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.client.eval(script, {
        keys: [fullKey],
        arguments: [lockId],
      });
      
      return result === 1;
    } catch (error) {
      logger.error(`Lock release error for ${lockKey}:`, error);
      return false;
    }
  }
}

// 缓存装饰器工厂
export function Cacheable(options: {
  key?: (args: any[]) => string;
  ttl?: number;
  tags?: string[];
}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cache = CacheService.getInstance();
      
      // 生成缓存键
      const cacheKey = options.key 
        ? options.key(args)
        : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return cached;
      }
      
      // 执行原方法
      logger.debug(`Cache miss for key: ${cacheKey}`);
      const result = await method.apply(this, args);
      
      // 存储到缓存
      await cache.set(cacheKey, result, {
        ttl: options.ttl,
        tags: options.tags,
      });
      
      return result;
    };
    
    return descriptor;
  };
}

// 缓存失效装饰器
export function CacheEvict(options: {
  keys?: (args: any[]) => string[];
  tags?: string[];
}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      const cache = CacheService.getInstance();
      
      // 清理指定的缓存键
      if (options.keys) {
        const keys = options.keys(args);
        for (const key of keys) {
          await cache.del(key);
        }
      }
      
      // 清理指定的标签
      if (options.tags) {
        await cache.clearByTags(options.tags);
      }
      
      return result;
    };
    
    return descriptor;
  };
}