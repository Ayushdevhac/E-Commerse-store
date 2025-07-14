import express from 'express';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { getDailySalesData } from '../controllers/analytics.controller.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';

const router = express.Router();

router.get('/', protectRoute, adminRoute, async (req, res) => {
    try {
        // Get basic analytics data
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        
        const salesData = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }
        ]);
        
        const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 };
        
        // Get daily sales data for the last 7 days
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        const dailySalesData = await getDailySalesData(startDate, endDate);
        
        res.status(200).json({
            analyticsData: {
                users: totalUsers,
                products: totalProducts,
                totalSales,
                totalRevenue
            },
            dailySalesData
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;