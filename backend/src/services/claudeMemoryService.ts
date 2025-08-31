import { PrismaClient } from '@prisma/client';

export interface ClaudeMemoryCreateInput {
  userId: string;
  sessionId?: string;
  memoryType: string;
  key: string;
  title?: string;
  content: any;
  summary?: string;
  tags?: string[];
  priority?: number;
  confidence?: number;
  expiresAt?: Date;
  metadata?: any;
}

export interface ClaudeMemoryUpdateInput {
  title?: string;
  content?: any;
  summary?: string;
  tags?: string[];
  priority?: number;
  confidence?: number;
  expiresAt?: Date;
  metadata?: any;
  isActive?: boolean;
}

export interface ClaudeMemorySearchOptions {
  userId: string;
  memoryType?: string;
  sessionId?: string;
  tags?: string[];
  keyword?: string;
  minPriority?: number;
  minConfidence?: number;
  includeExpired?: boolean;
  limit?: number;
  offset?: number;
}

export class ClaudeMemoryService {
  constructor(private prisma: PrismaClient) {}

  async createMemory(data: ClaudeMemoryCreateInput) {
    const memory = await this.prisma.claudeMemory.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        memoryType: data.memoryType,
        key: data.key,
        title: data.title,
        content: JSON.stringify(data.content),
        summary: data.summary,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        priority: data.priority || 1,
        confidence: data.confidence || 1.0,
        expiresAt: data.expiresAt,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    return this.formatMemory(memory);
  }

  async updateMemory(userId: string, key: string, data: ClaudeMemoryUpdateInput) {
    const memory = await this.prisma.claudeMemory.update({
      where: { userId_key: { userId, key } },
      data: {
        ...data,
        content: data.content ? JSON.stringify(data.content) : undefined,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        updatedAt: new Date(),
      },
    });

    return this.formatMemory(memory);
  }

  async getMemory(userId: string, key: string) {
    const memory = await this.prisma.claudeMemory.findUnique({
      where: { userId_key: { userId, key } },
    });

    if (!memory) return null;

    await this.incrementAccessCount(memory.id);
    return this.formatMemory(memory);
  }

  async deleteMemory(userId: string, key: string) {
    await this.prisma.claudeMemory.delete({
      where: { userId_key: { userId, key } },
    });
  }

  async searchMemories(options: ClaudeMemorySearchOptions) {
    const where: any = {
      userId: options.userId,
      isActive: true,
    };

    if (options.memoryType) {
      where.memoryType = options.memoryType;
    }

    if (options.sessionId) {
      where.sessionId = options.sessionId;
    }

    if (options.minPriority) {
      where.priority = { gte: options.minPriority };
    }

    if (options.minConfidence) {
      where.confidence = { gte: options.minConfidence };
    }

    if (!options.includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    if (options.keyword) {
      where.OR = [
        { title: { contains: options.keyword } },
        { summary: { contains: options.keyword } },
        { content: { contains: options.keyword } },
      ];
    }

    const memories = await this.prisma.claudeMemory.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { confidence: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: options.limit || 50,
      skip: options.offset || 0,
    });

    return memories.map(memory => this.formatMemory(memory));
  }

  async getRecentMemories(userId: string, limit: number = 10) {
    const memories = await this.prisma.claudeMemory.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return memories.map(memory => this.formatMemory(memory));
  }

  async getImportantMemories(userId: string, minPriority: number = 3) {
    const memories = await this.prisma.claudeMemory.findMany({
      where: {
        userId,
        isActive: true,
        priority: { gte: minPriority },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { confidence: 'desc' },
      ],
    });

    return memories.map(memory => this.formatMemory(memory));
  }

  async createSession(userId: string, title?: string, context?: any) {
    const session = await this.prisma.claudeSession.create({
      data: {
        userId,
        title,
        context: context ? JSON.stringify(context) : null,
      },
    });

    return this.formatSession(session);
  }

  async updateSession(sessionId: string, data: { title?: string; context?: any; summary?: string }) {
    const session = await this.prisma.claudeSession.update({
      where: { id: sessionId },
      data: {
        ...data,
        context: data.context ? JSON.stringify(data.context) : undefined,
        updatedAt: new Date(),
      },
    });

    return this.formatSession(session);
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.claudeSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    if (!session) return null;

    return {
      ...this.formatSession(session),
      messages: session.messages.map(msg => this.formatMessage(msg)),
    };
  }

  async addMessage(sessionId: string, userId: string, role: string, content: string, metadata?: any) {
    const message = await this.prisma.claudeMessage.create({
      data: {
        sessionId,
        userId,
        role,
        content,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    await this.prisma.claudeSession.update({
      where: { id: sessionId },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
      },
    });

    return this.formatMessage(message);
  }

  async setPreference(userId: string, category: string, key: string, value: any, description?: string) {
    const preference = await this.prisma.claudePreference.upsert({
      where: { userId_category_key: { userId, category, key } },
      update: {
        value: JSON.stringify(value),
        description,
        updatedAt: new Date(),
      },
      create: {
        userId,
        category,
        key,
        value: JSON.stringify(value),
        description,
      },
    });

    return this.formatPreference(preference);
  }

  async getPreference(userId: string, category: string, key: string) {
    const preference = await this.prisma.claudePreference.findUnique({
      where: { userId_category_key: { userId, category, key } },
    });

    return preference ? this.formatPreference(preference) : null;
  }

  async getUserPreferences(userId: string, category?: string) {
    const preferences = await this.prisma.claudePreference.findMany({
      where: {
        userId,
        ...(category && { category }),
      },
      orderBy: { category: 'asc' },
    });

    return preferences.map(pref => this.formatPreference(pref));
  }

  async cleanupExpiredMemories() {
    const result = await this.prisma.claudeMemory.deleteMany({
      where: {
        isActive: true,
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }

  async getMemoryStats(userId: string) {
    const [totalMemories, activeMemories, memoriesByType] = await Promise.all([
      this.prisma.claudeMemory.count({ where: { userId } }),
      this.prisma.claudeMemory.count({ where: { userId, isActive: true } }),
      this.prisma.claudeMemory.groupBy({
        by: ['memoryType'],
        where: { userId, isActive: true },
        _count: true,
      }),
    ]);

    return {
      totalMemories,
      activeMemories,
      memoriesByType: memoriesByType.reduce((acc, item) => {
        acc[item.memoryType] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private async incrementAccessCount(memoryId: string) {
    await this.prisma.claudeMemory.update({
      where: { id: memoryId },
      data: {
        accessCount: { increment: 1 },
        lastAccessed: new Date(),
      },
    });
  }

  private formatMemory(memory: any) {
    return {
      ...memory,
      content: memory.content ? JSON.parse(memory.content) : null,
      tags: memory.tags ? JSON.parse(memory.tags) : null,
      metadata: memory.metadata ? JSON.parse(memory.metadata) : null,
    };
  }

  private formatSession(session: any) {
    return {
      ...session,
      context: session.context ? JSON.parse(session.context) : null,
    };
  }

  private formatMessage(message: any) {
    return {
      ...message,
      metadata: message.metadata ? JSON.parse(message.metadata) : null,
    };
  }

  private formatPreference(preference: any) {
    return {
      ...preference,
      value: preference.value ? JSON.parse(preference.value) : null,
    };
  }
}