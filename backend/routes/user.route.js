import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { validateProfileUpdate } from '../middleware/validation.middleware.js';
import { getUserStats, updateUserProfile } from '../controllers/user.controller.js';

const router = express.Router();

router.get('/stats', protectRoute, getUserStats);
router.put('/profile', protectRoute, validateProfileUpdate, updateUserProfile);

export default router;
