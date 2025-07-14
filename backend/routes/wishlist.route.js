import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, toggleWishlist } from '../controllers/wishlist.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protectRoute, getWishlist);
router.post('/add', protectRoute, addToWishlist);
router.delete('/:productId', protectRoute, removeFromWishlist);
router.post('/toggle', protectRoute, toggleWishlist);

export default router;
