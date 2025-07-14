import express from 'express';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { createVipCoupons, checkVipEligibility, createMyVipCoupon } from '../controllers/vip.controller.js';

const router = express.Router();

// Admin route to create VIP coupons for all qualifying customers
router.post('/create-all', protectRoute, adminRoute, createVipCoupons);

// Check if current user qualifies for VIP coupon
router.get('/eligibility', protectRoute, checkVipEligibility);

// Create VIP coupon for current user (if eligible)
router.post('/create-mine', protectRoute, createMyVipCoupon);

export default router;
