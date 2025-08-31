import { Router } from 'express';
import * as claudeMemoryController from '../controllers/claudeMemoryController';
import { validateAuth } from '../middleware/auth';

const router = Router();

// Memory routes
router.post('/memories', validateAuth, claudeMemoryController.createMemory);
router.get('/memories/search', validateAuth, claudeMemoryController.searchMemories);
router.get('/memories/recent', validateAuth, claudeMemoryController.getRecentMemories);
router.get('/memories/important', validateAuth, claudeMemoryController.getImportantMemories);
router.get('/memories/stats', validateAuth, claudeMemoryController.getMemoryStats);
router.delete('/memories/expired', validateAuth, claudeMemoryController.cleanupExpiredMemories);
router.get('/memories/:key', validateAuth, claudeMemoryController.getMemory);
router.put('/memories/:key', validateAuth, claudeMemoryController.updateMemory);
router.delete('/memories/:key', validateAuth, claudeMemoryController.deleteMemory);

// Session routes
router.post('/sessions', validateAuth, claudeMemoryController.createSession);
router.get('/sessions/:sessionId', validateAuth, claudeMemoryController.getSession);
router.put('/sessions/:sessionId', validateAuth, claudeMemoryController.updateSession);
router.post('/sessions/:sessionId/messages', validateAuth, claudeMemoryController.addMessage);

// Preference routes
router.get('/preferences', validateAuth, claudeMemoryController.getUserPreferences);
router.get('/preferences/:category/:key', validateAuth, claudeMemoryController.getPreference);
router.put('/preferences/:category/:key', validateAuth, claudeMemoryController.setPreference);

export default router;