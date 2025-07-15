import express from 'express';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import {
    clearAllCaches,
    clearSpecificCache,
    getCacheStats,
    getDatabaseStats,
    getSecurityStats,
    updateSecuritySettings,
    getSystemLogs,
    getPasswordRequirements,
    getSecurityHealth,
    getBlacklist,
    addToBlacklist,
    removeFromBlacklist,
    getSecurityEvents
} from '../controllers/admin.controller.js';

const router = express.Router();

// Cache management routes (admin only)
router.post('/cache/clear', protectRoute, adminRoute, clearAllCaches);
router.post('/cache/clear/:cacheType', protectRoute, adminRoute, clearSpecificCache);
router.get('/cache/stats', protectRoute, adminRoute, getCacheStats);

// Database management routes (admin only)
router.get('/database/stats', protectRoute, adminRoute, getDatabaseStats);

// Security management routes (admin only)
router.get('/security/stats', protectRoute, adminRoute, getSecurityStats);
router.put('/security/settings', protectRoute, adminRoute, updateSecuritySettings);
router.get('/security/logs', protectRoute, adminRoute, getSystemLogs);
router.get('/security/health', protectRoute, adminRoute, getSecurityHealth);
router.get('/security/events', protectRoute, adminRoute, getSecurityEvents);

// IP Blacklist management routes (admin only)
router.get('/security/blacklist', protectRoute, adminRoute, getBlacklist);
router.post('/security/blacklist', protectRoute, adminRoute, addToBlacklist);
router.delete('/security/blacklist/:ip', protectRoute, adminRoute, removeFromBlacklist);

// Public routes (no auth required)
router.get('/password-requirements', getPasswordRequirements);

export default router;
