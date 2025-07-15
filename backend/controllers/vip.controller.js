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

// Helper function to determine customer tier (ultra exclusive)
function getCustomerTier(customer) {
    if (customer.totalSpent >= 2000 || (customer.orderCount >= 8 && customer.avgOrderValue >= 300)) {
        return 'platinum';
    } else if (customer.totalSpent >= 1200 || (customer.orderCount >= 6 && customer.avgOrderValue >= 250)) {
        return 'gold';
    } else if (customer.totalSpent >= 800 || (customer.orderCount >= 4 && customer.avgOrderValue >= 200)) {
        return 'silver';
    } else {
        return 'bronze';
    }
}

// Helper function to check if user had recent VIP coupon (cooldown period)
async function hasRecentVipCoupon(userId, monthsBack = 3) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
    
    const recentVipCoupon = await Coupon.findOne({
        userId: userId,
        code: { $regex: /^VIP/ },
        createdAt: { $gte: cutoffDate }
    });
    
    return !!recentVipCoupon;
}

// Selective random eligibility (only 70% of qualifiers get VIP)
function passesRandomSelection() {
    return Math.random() < 0.7; // 70% chance
}

// Helper function to get VIP benefits based on tier (ultra exclusive)
function getVipBenefits(tier, totalSpent) {
    switch (tier) {
        case 'platinum':
            return { discountPercentage: 35, minimumAmount: 100 };  // Ultra premium benefits
        case 'gold':
            return { discountPercentage: 30, minimumAmount: 150 }; // Premium benefits
        case 'silver':
            return { discountPercentage: 25, minimumAmount: 200 }; // Excellent benefits
        case 'bronze':
            return { discountPercentage: 20, minimumAmount: 250 }; // Good VIP benefits
        default:
            return null; // No VIP benefits for non-qualifying customers
    }
}

// Create VIP coupons for high-value customers with stricter criteria
export const createVipCoupons = async (req, res) => {
    try {
        console.log('🎯 Creating VIP coupons for qualifying customers...');        // Ultra exclusive criteria for VIP eligibility (much stricter)
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
                        // Tier 1: Ultra Premium customers (spend $2000+ OR $1500+ with 6+ orders)
                        { totalSpent: { $gte: 2000 } },
                        { 
                            $and: [
                                { totalSpent: { $gte: 1500 } },
                                { orderCount: { $gte: 6 } }
                            ]
                        },
                        // Tier 2: Premium loyal customers (8+ orders AND $1200+ total AND $200+ average)
                        { 
                            $and: [
                                { orderCount: { $gte: 8 } },
                                { totalSpent: { $gte: 1200 } },
                                { avgOrderValue: { $gte: 200 } }
                            ]
                        },
                        // Tier 3: High-value exclusive customers ($500+ average order value AND 4+ orders)
                        {
                            $and: [
                                { avgOrderValue: { $gte: 500 } },
                                { orderCount: { $gte: 4 } },
                                { totalSpent: { $gte: 1000 } }
                            ]
                        }
                    ]
                }
            },
            {
                $sort: { totalSpent: -1 }
            }
        ];        const qualifyingCustomers = await Order.aggregate(pipeline);
        const results = [];
        let vipCouponsCreated = 0;
        let eligibleButNotSelected = 0;
        let cooldownBlocked = 0;

        console.log(`🎯 Found ${qualifyingCustomers.length} customers meeting basic VIP criteria`);

        for (const customer of qualifyingCustomers) {
            const user = await User.findById(customer._id);
            if (!user) continue;

            // Check if user already has an active VIP coupon
            const existingVipCoupon = await Coupon.findOne({
                userId: user._id,
                code: { $regex: /^VIP/ },
                isActive: true
            });

            // Check for recent VIP coupon (cooldown period)
            const hasRecentVip = await hasRecentVipCoupon(user._id, 3);

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
            } else if (hasRecentVip) {
                cooldownBlocked++;
                results.push({
                    user: user.email,
                    totalSpent: customer.totalSpent,
                    orderCount: customer.orderCount,
                    avgOrderValue: customer.avgOrderValue,
                    status: 'cooldown_period',
                    reason: 'Had VIP coupon within last 3 months',
                    tier: getCustomerTier(customer)
                });
            } else if (!passesRandomSelection()) {
                // Ultra selective: only 70% of qualifying customers get VIP
                eligibleButNotSelected++;
                results.push({
                    user: user.email,
                    totalSpent: customer.totalSpent,
                    orderCount: customer.orderCount,
                    avgOrderValue: customer.avgOrderValue,
                    status: 'eligible_not_selected',
                    reason: 'VIP program is highly selective',
                    tier: getCustomerTier(customer)
                });
            } else {
                // Create VIP coupon for selected customer
                const tier = getCustomerTier(customer);
                const vipBenefits = getVipBenefits(tier, customer.totalSpent);
                
                if (!vipBenefits) continue;

                const couponCode = generateCouponCode('VIP');
                const expirationDate = new Date();
                
                // VIP coupons have longer validity based on tier
                const validityDays = tier === 'platinum' ? 180 : tier === 'gold' ? 120 : 90;
                expirationDate.setDate(expirationDate.getDate() + validityDays);

                const newCoupon = await Coupon.create({
                    code: couponCode,
                    discountPercentage: vipBenefits.discountPercentage,
                    minimumAmount: vipBenefits.minimumAmount,
                    expirationDate: expirationDate,
                    isActive: true,
                    userId: user._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                vipCouponsCreated++;
                results.push({
                    user: user.email,
                    totalSpent: customer.totalSpent,
                    orderCount: customer.orderCount,
                    avgOrderValue: customer.avgOrderValue,
                    status: 'coupon_created',
                    couponCode: newCoupon.code,
                    discountPercentage: vipBenefits.discountPercentage,
                    minimumAmount: vipBenefits.minimumAmount,
                    expirationDate: expirationDate,
                    tier: tier,
                    validityDays: validityDays
                });
            }
        }

        console.log(`✨ VIP Summary: ${vipCouponsCreated} created, ${eligibleButNotSelected} not selected, ${cooldownBlocked} in cooldown`);

        res.status(200).json({
            message: 'Ultra-selective VIP coupon generation completed',
            customersProcessed: qualifyingCustomers.length,
            vipCouponsCreated: vipCouponsCreated,
            eligibleButNotSelected: eligibleButNotSelected,
            cooldownBlocked: cooldownBlocked,
            selectivityRate: `${((vipCouponsCreated / Math.max(qualifyingCustomers.length, 1)) * 100).toFixed(1)}%`,
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
        };        // Check if user qualifies using the new ultra-strict criteria
        const qualifiesPremium = userSpending.totalSpent >= 2000 || 
            (userSpending.totalSpent >= 1500 && userSpending.orderCount >= 6);
        
        const qualifiesLoyal = userSpending.orderCount >= 8 && 
            userSpending.totalSpent >= 1200 && 
            userSpending.avgOrderValue >= 200;
        
        const qualifiesHighValue = userSpending.avgOrderValue >= 500 && 
            userSpending.orderCount >= 4 && 
            userSpending.totalSpent >= 1000;
        
        const meetsBasicCriteria = qualifiesPremium || qualifiesLoyal || qualifiesHighValue;

        // Check for recent VIP coupon (cooldown)
        const hasRecentVip = await hasRecentVipCoupon(userId, 3);

        // Final eligibility includes random selection factor
        const isEligible = meetsBasicCriteria && !hasRecentVip && passesRandomSelection();

        // Check if user already has VIP coupon
        const existingVipCoupon = await Coupon.findOne({
            userId: userId,
            code: { $regex: /^VIP/ },
            isActive: true
        });

        // Determine user's tier if they meet basic criteria
        let tier = null;
        let eligibilityReason = '';
        
        if (existingVipCoupon) {
            eligibilityReason = 'You already have an active VIP coupon';
        } else if (hasRecentVip) {
            eligibilityReason = 'VIP coupons are limited to once every 3 months';
        } else if (!meetsBasicCriteria) {
            // Provide specific guidance on how to qualify
            if (userSpending.totalSpent < 1000) {
                eligibilityReason = `Spend $${(1000 - userSpending.totalSpent).toFixed(2)} more to qualify for VIP consideration`;
            } else if (userSpending.orderCount < 4) {
                eligibilityReason = `Place ${4 - userSpending.orderCount} more orders to qualify for VIP status`;
            } else if (userSpending.avgOrderValue < 200) {
                eligibilityReason = `Increase average order value to $200+ (current: $${userSpending.avgOrderValue.toFixed(2)}) for VIP eligibility`;
            } else {
                eligibilityReason = 'Continue building your exclusive purchase history to unlock VIP benefits';
            }
        } else if (meetsBasicCriteria && !isEligible) {
            eligibilityReason = 'You meet VIP criteria! Our exclusive program has limited spots - keep shopping for future consideration';
        } else {
            tier = getCustomerTier(userSpending);
            if (qualifiesPremium) {
                eligibilityReason = 'Ultra Premium customer ($2000+ total OR $1500+ with 6+ orders)';
            } else if (qualifiesLoyal) {
                eligibilityReason = 'Loyal VIP customer (8+ orders, $1200+ total, $200+ avg)';            } else if (qualifiesHighValue) {
                eligibilityReason = 'High-value exclusive customer ($500+ avg, 4+ orders, $1000+ total)';
            }
        }

        res.status(200).json({
            isEligible: isEligible,
            meetsBasicCriteria: meetsBasicCriteria,
            totalSpent: userSpending.totalSpent,
            orderCount: userSpending.orderCount,
            avgOrderValue: userSpending.avgOrderValue,
            hasVipCoupon: !!existingVipCoupon,
            hasRecentVip: hasRecentVip,
            tier: tier,
            eligibilityReason: eligibilityReason,
            qualificationCriteria: {
                ultraPremium: 'Spend $2000+ OR $1500+ with 6+ orders',
                loyalVip: '8+ orders, $1200+ total, $200+ average',
                highValue: '$500+ average order, 4+ orders, $1000+ total',
                exclusivity: 'VIP status is highly selective and limited',
                cooldown: '3-month minimum between VIP coupons'
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
        ]);        const userSpending = spendingData[0];

        // Check if user qualifies using the new ultra-strict criteria
        const qualifiesPremium = userSpending?.totalSpent >= 2000 || 
            (userSpending?.totalSpent >= 1500 && userSpending?.orderCount >= 6);
        
        const qualifiesLoyal = userSpending?.orderCount >= 8 && 
            userSpending?.totalSpent >= 1200 && 
            userSpending?.avgOrderValue >= 200;
        
        const qualifiesHighValue = userSpending?.avgOrderValue >= 500 && 
            userSpending?.orderCount >= 4 && 
            userSpending?.totalSpent >= 1000;
        
        const meetsBasicCriteria = qualifiesPremium || qualifiesLoyal || qualifiesHighValue;

        // Check for recent VIP coupon (cooldown)
        const hasRecentVip = await hasRecentVipCoupon(userId, 3);

        // Final eligibility includes random selection and cooldown
        const isEligible = meetsBasicCriteria && !hasRecentVip && passesRandomSelection();

        if (!userSpending || !isEligible) {
            let reason = '';
            if (!userSpending || !meetsBasicCriteria) {
                reason = 'You do not meet the ultra-exclusive VIP criteria yet.';
            } else if (hasRecentVip) {
                reason = 'VIP coupons are limited to once every 3 months.';
            } else {
                reason = 'VIP program has limited spots. You meet criteria but weren\'t selected this time.';
            }

            return res.status(400).json({ 
                message: reason,
                requirements: {
                    option1: 'Spend $2000+ total OR $1500+ with 6+ orders (Ultra Premium)',
                    option2: 'Place 8+ orders AND spend $1200+ total AND $200+ average per order (Loyal VIP)',
                    option3: 'Average $500+ per order with 4+ orders AND $1000+ total (High-Value)'
                },
                current: {
                    totalSpent: userSpending?.totalSpent || 0,
                    orderCount: userSpending?.orderCount || 0,
                    avgOrderValue: userSpending?.avgOrderValue || 0
                },
                exclusivity: 'VIP status is ultra-exclusive with limited availability and cooldown periods.',
                tip: 'Keep shopping to increase your chances for future VIP consideration!'
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
        }        // Determine VIP tier and benefits
        const tier = getCustomerTier(userSpending);
        const vipBenefits = getVipBenefits(tier, userSpending.totalSpent);

        const couponCode = generateCouponCode('VIP');
        const expirationDate = new Date();
        const validityDays = tier === 'platinum' ? 180 : tier === 'gold' ? 120 : 90;
        expirationDate.setDate(expirationDate.getDate() + validityDays);        const newCoupon = await Coupon.create({
            code: couponCode,
            discountPercentage: vipBenefits.discountPercentage,
            minimumAmount: vipBenefits.minimumAmount,
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
            avgOrderValue: userSpending.avgOrderValue,
            exclusivity: 'Congratulations! You are part of our ultra-exclusive VIP program.'
        });

    } catch (error) {
        console.error('Error creating VIP coupon:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
