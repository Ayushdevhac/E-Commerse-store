import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';

export const getAnalyticsData = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        
        // Get sales data from orders, not products
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
        
        res.json({
            users: totalUsers,
            products: totalProducts,
            totalSales,
            totalRevenue
        });
    } catch (error) {
        console.error('Error in getAnalyticsData:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

export const getDailySalesData = async (startDate, endDate) => {
    try {
        const dailySalesData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const dateArray = getDatesInRange(startDate, endDate);
        return dateArray.map(date => {
            const foundData = dailySalesData.find(data => data._id === date);
            return {
                date,
                sales: foundData ? foundData.sales : 0,
                revenue: foundData ? foundData.revenue : 0
            }
        });
    } catch (error) {
        console.error('Error fetching daily sales data:', error);
        throw error;
    }
}

function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}
