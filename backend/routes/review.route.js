import express from 'express';
import { getProductReviews, createReview, updateReview, deleteReview } from '../controllers/review.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);
router.post('/', protectRoute, createReview);
router.put('/:reviewId', protectRoute, updateReview);
router.delete('/:reviewId', protectRoute, deleteReview);

export default router;
