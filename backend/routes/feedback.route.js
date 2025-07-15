import express from 'express';
import { 
	submitFeedback, 
	getAllFeedback, 
	updateFeedbackStatus, 
	getFeedbackStats,
	validateFeedback
} from '../controllers/feedback.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Submit feedback (authenticated users)
router.post('/', protectRoute, validateFeedback, submitFeedback);

// Admin routes
router.get('/', protectRoute, adminRoute, getAllFeedback);
router.put('/:id/status', protectRoute, adminRoute, updateFeedbackStatus);
router.get('/stats', protectRoute, adminRoute, getFeedbackStats);

export default router;
