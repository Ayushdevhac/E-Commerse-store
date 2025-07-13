import User from '../models/user.model.js';
import product from '../models/product.model.js';

export const getAnalyticsData = async (req, res) => {
    const totalUsers = await User.countDocuments();

    const totalProudcts = await product.countDocuments();
    const salesData = await product.aggregate([
        {
            $group: {

                _id: null,  // Grouping by null to get total sales and revenue
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" }
            }
        }
    ]);
    const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 };
    return {
        totalUsers,
        totalProudcts,
        totalSales,
        totalRevenue
    }
}

export const getDailySalesData = async (startDate, endDate) => {
   try {
     const dailySalesData = await product.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" }
            }
        },
        {
            $sort: { _id: 1 } // Sort by date
        }
    ]);
    const dateArray = getDatesInRange(startDate, endDate);
    return dateArray.map(date => {
        const foundData = dailySalesData.find(data => data._id === date);

        return{
            date,
            sales: foundData ? foundData.totalSales : 0,
            revenue: foundData ? foundData.totalRevenue : 0
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
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}   
