import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { validateCoupon, getCoupons } from '../controllers/coupon.controller.js';
const router = express.Router();

router.get('/', protectRoute, getCoupons);
router.get('/validate', protectRoute, validateCoupon);

export default router;