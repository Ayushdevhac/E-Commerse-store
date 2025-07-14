import User from '../models/user.model.js';
import Order from '../models/order.model.js';
import Coupon from '../models/coupon.model.js';

// Generate random coupon code
function generateCouponCode(prefix = 'VIP') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Helper function to determine customer tier
function getCustomerTier(customer) {
    if (customer.totalSpent >= 1000 || (customer.orderCount >= 5 && customer.avgOrderValue >= 200)) {
        return 'platinum';
    } else if (customer.totalSpent >= 500 || (customer.orderCount >= 3 && customer.avgOrderValue >= 150)) {
        return 'gold';
    } else {
        return 'silver';
    }
}

// Helper function to get VIP benefits based on tier
function getVipBenefits(tier, totalSpent) {
    switch (tier) {
        case 'platinum':
            return { discountPercentage: 25, minimumAmount: 100 };
        case 'gold':
            return { discountPercentage: 20, minimumAmount: 150 };
        case 'silver':
            return { discountPercentage: 15, minimumAmount: 200 };
        default:
            return { discountPercentage: 10, minimumAmount: 250 };
    }
}

// Create VIP coupons for high-value customers with stricter criteria
export const createVipCoupons = async (req, res) => {
    try {
        console.log('🎯 Creating VIP coupons for qualifying customers...');

        // More sophisticated criteria for VIP eligibility
        const pipeline = [
            {
                $group: {
                    _id: '$user',
                    totalSpent: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 },
                    avgOrderValue: { $avg: '$totalAmount' },
                    firstOrderDate: { $min: '$createdAt' },
                    lastOrderDate: { $max: '$createdAt' }
                }
            },
            {
                $match: {
                    $or: [
                        // Tier 1: High spenders (spend $500+ regardless of order count)
                        { totalSpent: { $gte: 500 } },
                        // Tier 2: Loyal customers (3+ orders AND $300+ total)
                        { 
                            $and: [
                                { orderCount: { $gte: 3 } },
                                { totalSpent: { $gte: 300 } }
                            ]
                        },
                        // Tier 3: High-value single orders ($250+ average order value AND 2+ orders)
                        {
                            $and: [
                                { avgOrderValue: { $gte: 250 } },
                                { orderCount: { $gte: 2 } }
                            ]
                        }
                    ]
                }
            },
            {
                $sort: { totalSpent: -1 }
            }
        ];

        const qualifyingCustomers = await Order.aggregate(pipeline);
        const results = [];

        for (const customer of qualifyingCustomers) {
            const user = await User.findById(customer._id);
            if (!user) continue;

            // Check if user already has an active VIP coupon
            const existingVipCoupon = await Coupon.findOne({
                userId: user._id,
                code: { $regex: /^VIP/ },
                isActive: true
            });

            if (existingVipCoupon) {
                results.push({
                    user: user.email,
                    totalSpent: customer.totalSpent,
                    orderCount: customer.orderCount,
                    avgOrderValue: customer.avgOrderValue,
                    status: 'already_has_vip_coupon',
                    couponCode: existingVipCoupon.code,
                    tier: getCustomerTier(customer)
                });
            } else {
                // Determine VIP tier and benefits
                const tier = getCustomerTier(customer);
                const { discountPercentage, minimumAmount } = getVipBenefits(tier, customer.totalSpent);

                const couponCode = generateCouponCode('VIP');
                const expirationDate = new Date();
                
                // VIP coupons have longer validity based on tier
                const validityDays = tier === 'platinum' ? 120 : tier === 'gold' ? 90 : 60;
                expirationDate.setDate(expirationDate.getDate() + validityDays);

                const newCoupon = await Coupon.create({
                    code: couponCode,
                    discountPercentage: discountPercentage,
                    minimumAmount: minimumAmount,
                    expirationDate: expirationDate,
                    isActive: true,
                    userId: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                results.push({
                    user: user.email,
                    totalSpent: customer.totalSpent,
                    orderCount: customer.orderCount,
                    avgOrderValue: customer.avgOrderValue,
                    status: 'coupon_created',
                    couponCode: newCoupon.code,
                    discountPercentage: discountPercentage,
                    minimumAmount: minimumAmount,
                    expirationDate: expirationDate,
                    tier: tier,
                    validityDays: validityDays
                });
            }
        }

        res.status(200).json({
            message: 'VIP coupon generation completed',
            customersProcessed: qualifyingCustomers.length,
            results: results
        });

    } catch (error) {
        console.error('Error creating VIP coupons:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Check if current user qualifies for VIP coupon
export const checkVipEligibility = async (req, res) => {
    try {
        const userId = req.user._id;

        // Calculate user's total spending with more detailed metrics
        const spendingData = await Order.aggregate([
            {
                $match: { user: userId }
            },
            {
                $group: {
                    _id: '$user',
                    totalSpent: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 },
                    avgOrderValue: { $avg: '$totalAmount' },
                    firstOrderDate: { $min: '$createdAt' },
                    lastOrderDate: { $max: '$createdAt' }
                }
            }
        ]);

        const userSpending = spendingData[0] || { 
            totalSpent: 0, 
            orderCount: 0, 
            avgOrderValue: 0,
            firstOrderDate: null,
            lastOrderDate: null
        };

        // Check if user qualifies using the new criteria
        const qualifiesHighSpender = userSpending.totalSpent >= 500;
        const qualifiesLoyal = userSpending.orderCount >= 3 && userSpending.totalSpent >= 300;
        const qualifiesHighValue = userSpending.avgOrderValue >= 250 && userSpending.orderCount >= 2;
        
        const isEligible = qualifiesHighSpender || qualifiesLoyal || qualifiesHighValue;

        // Check if user already has VIP coupon
        const existingVipCoupon = await Coupon.findOne({
            userId: userId,
            code: { $regex: /^VIP/ },
            isActive: true
        });

        // Determine user's tier if eligible
        let tier = null;
        let eligibilityReason = '';
        
        if (isEligible) {
            tier = getCustomerTier(userSpending);
            if (qualifiesHighSpender) {
                eligibilityReason = 'High spender ($500+)';
            } else if (qualifiesLoyal) {
                eligibilityReason = 'Loyal customer (3+ orders, $300+)';
            } else if (qualifiesHighValue) {
                eligibilityReason = 'High-value orders ($250+ avg, 2+ orders)';
            }
        } else {
            // Provide guidance on how to qualify
            if (userSpending.totalSpent < 300) {
                eligibilityReason = `Spend $${(300 - userSpending.totalSpent).toFixed(2)} more to start qualifying`;
            } else if (userSpending.orderCount < 2) {
                eligibilityReason = 'Place at least 2 orders to qualify';
            } else {
                eligibilityReason = 'Continue shopping to unlock VIP benefits';
            }
        }

        res.status(200).json({
            isEligible: isEligible,
            totalSpent: userSpending.totalSpent,
            orderCount: userSpending.orderCount,
            avgOrderValue: userSpending.avgOrderValue,
            hasVipCoupon: !!existingVipCoupon,
            tier: tier,
            eligibilityReason: eligibilityReason,
            qualificationCriteria: {
                highSpender: qualifiesHighSpender,
                loyalCustomer: qualifiesLoyal,
                highValueOrders: qualifiesHighValue
            },
            vipCoupon: existingVipCoupon ? {
                code: existingVipCoupon.code,
                discountPercentage: existingVipCoupon.discountPercentage,
                minimumAmount: existingVipCoupon.minimumAmount,
                expirationDate: existingVipCoupon.expirationDate
            } : null,
            message: isEligible 
                ? (existingVipCoupon ? 'You already have a VIP coupon!' : 'You qualify for a VIP coupon!')
                : eligibilityReason
        });

    } catch (error) {
        console.error('Error checking VIP eligibility:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Manually create VIP coupon for current user (if eligible)
export const createMyVipCoupon = async (req, res) => {
    try {
        const userId = req.user._id;

        // Calculate user's total spending with detailed metrics
        const spendingData = await Order.aggregate([
            {
                $match: { user: userId }
            },
            {
                $group: {
                    _id: '$user',
                    totalSpent: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 },
                    avgOrderValue: { $avg: '$totalAmount' }
                }
            }
        ]);

        const userSpending = spendingData[0];
        
        // Check if user qualifies using the new criteria
        const qualifiesHighSpender = userSpending?.totalSpent >= 500;
        const qualifiesLoyal = userSpending?.orderCount >= 3 && userSpending?.totalSpent >= 300;
        const qualifiesHighValue = userSpending?.avgOrderValue >= 250 && userSpending?.orderCount >= 2;
        
        const isEligible = qualifiesHighSpender || qualifiesLoyal || qualifiesHighValue;

        if (!userSpending || !isEligible) {
            return res.status(400).json({ 
                message: 'You do not qualify for VIP coupon yet',
                requirements: {
                    option1: 'Spend $500+ total',
                    option2: 'Place 3+ orders AND spend $300+ total',
                    option3: 'Average $250+ per order with 2+ orders'
                },
                current: {
                    totalSpent: userSpending?.totalSpent || 0,
                    orderCount: userSpending?.orderCount || 0,
                    avgOrderValue: userSpending?.avgOrderValue || 0
                }
            });
        }

        // Check if user already has VIP coupon
        const existingVipCoupon = await Coupon.findOne({
            userId: userId,
            code: { $regex: /^VIP/ },
            isActive: true
        });

        if (existingVipCoupon) {
            return res.status(400).json({ 
                message: 'You already have an active VIP coupon',
                coupon: {
                    code: existingVipCoupon.code,
                    discountPercentage: existingVipCoupon.discountPercentage,
                    minimumAmount: existingVipCoupon.minimumAmount
                }
            });
        }

        // Determine VIP tier and benefits
        const tier = getCustomerTier(userSpending);
        const { discountPercentage, minimumAmount } = getVipBenefits(tier, userSpending.totalSpent);

        const couponCode = generateCouponCode('VIP');
        const expirationDate = new Date();
        const validityDays = tier === 'platinum' ? 120 : tier === 'gold' ? 90 : 60;
        expirationDate.setDate(expirationDate.getDate() + validityDays);

        const newCoupon = await Coupon.create({
            code: couponCode,
            discountPercentage: discountPercentage,
            minimumAmount: minimumAmount,
            expirationDate: expirationDate,
            isActive: true,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).json({
            message: `${tier.toUpperCase()} VIP coupon created successfully!`,
            coupon: {
                code: newCoupon.code,
                discountPercentage: newCoupon.discountPercentage,
                minimumAmount: newCoupon.minimumAmount,
                expirationDate: newCoupon.expirationDate,
                validityDays: validityDays
            },
            tier: tier,
            totalSpent: userSpending.totalSpent,
            orderCount: userSpending.orderCount,
            avgOrderValue: userSpending.avgOrderValue
        });

    } catch (error) {
        console.error('Error creating VIP coupon:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
