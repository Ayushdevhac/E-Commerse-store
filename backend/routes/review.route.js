import express from 'express';
import {
	createReview,
	getProductReviews,
	getUserReviews,
	updateReview,
	deleteReview,
	markReviewHelpful,
	getReviewableProducts
} from '../controllers/review.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews); // Get reviews for a product

// Protected routes (require authentication)
router.use(protectRoute);

router.get('/my-reviews', getUserReviews); // Get user's own reviews
router.get('/reviewable-products', getReviewableProducts); // Get products user can review
router.post('/', createReview); // Create a new review
router.put('/:reviewId', updateReview); // Update a review
router.delete('/:reviewId', deleteReview); // Delete a review
router.post('/:reviewId/helpful', markReviewHelpful); // Mark review as helpful

export default router;
