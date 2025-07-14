import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { createCheckoutSession, checkoutSucess } from '../controllers/payment.controller.js';

const router = express.Router();
router.post('/create-checkout-session', protectRoute, createCheckoutSession);
// Remove auth requirement for checkout-success since it's called after Stripe redirect
router.post('/checkout-success', checkoutSucess); 

export default router;