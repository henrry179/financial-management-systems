import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ClaudeMemoryService } from '../services/claudeMemoryService';
import prisma from '../lib/prisma';

let claudeMemoryService: ClaudeMemoryService;

const getClaudeMemoryService = () => {
  if (!claudeMemoryService) {
    claudeMemoryService = new ClaudeMemoryService(prisma);
  }
  return claudeMemoryService;
};

export const createMemory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const memory = await getClaudeMemoryService().createMemory({
      userId,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: memory,
      message: 'Memory created successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Memory with this key already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create memory',
      error: error.message,
    });
  }
};

export const updateMemory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { key } = req.params;
    
    const memory = await getClaudeMemoryService().updateMemory(userId, key, req.body);

    res.json({
      success: true,
      data: memory,
      message: 'Memory updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Memory not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update memory',
      error: error.message,
    });
  }
};

export const getMemory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { key } = req.params;
    
    const memory = await getClaudeMemoryService().getMemory(userId, key);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found',
      });
    }

    res.json({
      success: true,
      data: memory,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get memory',
      error: error.message,
    });
  }
};

export const deleteMemory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { key } = req.params;
    
    await getClaudeMemoryService().deleteMemory(userId, key);

    res.json({
      success: true,
      message: 'Memory deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Memory not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete memory',
      error: error.message,
    });
  }
};

export const searchMemories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const options = {
      userId,
      ...req.query,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      minPriority: req.query.minPriority ? parseInt(req.query.minPriority as string) : undefined,
      minConfidence: req.query.minConfidence ? parseFloat(req.query.minConfidence as string) : undefined,
      includeExpired: req.query.includeExpired === 'true',
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    };

    const memories = await getClaudeMemoryService().searchMemories(options);

    res.json({
      success: true,
      data: memories,
      pagination: {
        limit: options.limit || 50,
        offset: options.offset || 0,
        total: memories.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to search memories',
      error: error.message,
    });
  }
};

export const getRecentMemories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const memories = await getClaudeMemoryService().getRecentMemories(userId, limit);

    res.json({
      success: true,
      data: memories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get recent memories',
      error: error.message,
    });
  }
};

export const getImportantMemories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const minPriority = req.query.minPriority ? parseInt(req.query.minPriority as string) : 3;
    
    const memories = await getClaudeMemoryService().getImportantMemories(userId, minPriority);

    res.json({
      success: true,
      data: memories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get important memories',
      error: error.message,
    });
  }
};

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, context } = req.body;
    
    const session = await getClaudeMemoryService().createSession(userId, title, context);

    res.status(201).json({
      success: true,
      data: session,
      message: 'Session created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message,
    });
  }
};

export const updateSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = await getClaudeMemoryService().updateSession(sessionId, req.body);

    res.json({
      success: true,
      data: session,
      message: 'Session updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: error.message,
    });
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = await getClaudeMemoryService().getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get session',
      error: error.message,
    });
  }
};

export const addMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { sessionId } = req.params;
    const { role, content, metadata } = req.body;
    
    const message = await getClaudeMemoryService().addMessage(sessionId, userId, role, content, metadata);

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message added successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: error.message,
    });
  }
};

export const setPreference = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category, key } = req.params;
    const { value, description } = req.body;
    
    const preference = await getClaudeMemoryService().setPreference(userId, category, key, value, description);

    res.json({
      success: true,
      data: preference,
      message: 'Preference set successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to set preference',
      error: error.message,
    });
  }
};

export const getPreference = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category, key } = req.params;
    
    const preference = await getClaudeMemoryService().getPreference(userId, category, key);

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: 'Preference not found',
      });
    }

    res.json({
      success: true,
      data: preference,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get preference',
      error: error.message,
    });
  }
};

export const getUserPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category } = req.query;
    
    const preferences = await getClaudeMemoryService().getUserPreferences(userId, category as string);

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences',
      error: error.message,
    });
  }
};

export const getMemoryStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const stats = await getClaudeMemoryService().getMemoryStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get memory stats',
      error: error.message,
    });
  }
};

export const cleanupExpiredMemories = async (req: Request, res: Response) => {
  try {
    const count = await getClaudeMemoryService().cleanupExpiredMemories();

    res.json({
      success: true,
      data: { deletedCount: count },
      message: `Cleaned up ${count} expired memories`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired memories',
      error: error.message,
    });
  }
};