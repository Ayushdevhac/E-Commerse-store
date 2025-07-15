import Order from '../models/order.model.js';
import User from '../models/user.model.js';

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const orders = await Order.find({ user: userId })
            .populate('products.product', 'name image price')
            .sort({ createdAt: -1 });
        
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        const order = await Order.findOne({ 
            _id: id, 
            user: userId 
        }).populate('products.product', 'name image price description category');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.status(200).json(order);
    } catch (error) {        console.error('Error fetching order details:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin: Get all orders
export const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .populate('products.product', 'name image')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limit);

        res.status(200).json({
            orders,
            pagination: {
                currentPage: page,
                totalPages,
                totalOrders,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching all orders:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Admin: Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update status using the model method
        await order.updateStatus(status);

        // If completing order, set completedAt timestamp
        if (status === 'completed' && !order.completedAt) {
            order.completedAt = new Date();
            await order.save();
        }

        // Populate for response
        await order.populate('user', 'name email');
        await order.populate('products.product', 'name image');

        res.status(200).json({
            message: `Order status updated to ${status}`,
            order
        });
    } catch (error) {
        console.error('Error updating order status:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Auto-complete delivered orders (for scheduled jobs)
export const autoCompleteOrders = async (req, res) => {
    try {
        const daysAfterDelivery = parseInt(req.query.days) || 7; // Default 7 days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAfterDelivery);

        // Find delivered orders older than cutoff date
        const ordersToComplete = await Order.find({
            status: 'delivered',
            deliveredAt: { $lte: cutoffDate },
            completedAt: { $exists: false }
        });

        const updatedOrders = [];
        for (const order of ordersToComplete) {
            await order.updateStatus('completed');
            order.completedAt = new Date();
            await order.save();
            updatedOrders.push(order);
        }

        res.status(200).json({
            message: `Auto-completed ${updatedOrders.length} orders`,
            completedOrders: updatedOrders.length,
            orders: updatedOrders.map(order => ({
                id: order._id,
                deliveredAt: order.deliveredAt,
                completedAt: order.completedAt
            }))
        });
    } catch (error) {
        console.error('Error auto-completing orders:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get order analytics for admin
export const getOrderAnalytics = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const analytics = await Order.aggregate([
            {
                $facet: {
                    statusCounts: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    recentOrders: [
                        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                        { $group: { _id: null, count: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } }
                    ],
                    avgOrderValue: [
                        { $group: { _id: null, avgValue: { $avg: '$totalAmount' } } }
                    ],
                    completionTimes: [
                        {
                            $match: {
                                status: 'completed',
                                completedAt: { $exists: true },
                                createdAt: { $exists: true }
                            }
                        },
                        {
                            $project: {
                                completionTime: {
                                    $divide: [
                                        { $subtract: ['$completedAt', '$createdAt'] },
                                        1000 * 60 * 60 * 24 // Convert to days
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                avgCompletionDays: { $avg: '$completionTime' }
                            }
                        }
                    ]
                }
            }
        ]);

        const result = analytics[0];
        
        res.status(200).json({
            statusDistribution: result.statusCounts,
            recentActivity: result.recentOrders[0] || { count: 0, totalRevenue: 0 },
            averageOrderValue: result.avgOrderValue[0]?.avgValue || 0,
            averageCompletionDays: result.completionTimes[0]?.avgCompletionDays || 0
        });
    } catch (error) {
        console.error('Error fetching order analytics:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
