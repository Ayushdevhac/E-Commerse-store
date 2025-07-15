import express from 'express';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { 
    getMyOrders, 
    getOrderById, 
    getAllOrders, 
    updateOrderStatus, 
    autoCompleteOrders, 
    getOrderAnalytics 
} from '../controllers/order.controller.js';

const router = express.Router();

// User routes
router.get('/my-orders', protectRoute, getMyOrders);
router.get('/:id', protectRoute, getOrderById);

// Admin routes - Note: these will be accessed as /api/orders/admin/...
router.get('/admin/all', protectRoute, adminRoute, getAllOrders);
router.patch('/admin/:id/status', protectRoute, adminRoute, updateOrderStatus);
router.post('/admin/auto-complete', protectRoute, adminRoute, autoCompleteOrders);
router.get('/admin/analytics', protectRoute, adminRoute, getOrderAnalytics);

export default router;
