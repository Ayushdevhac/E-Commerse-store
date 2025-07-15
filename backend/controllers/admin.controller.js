import { client, ensureRedisConnection } from '../lib/redis.js';
import { securityHealthCheck, manageIPBlacklist } from '../lib/security.js';
import { securityLogger } from '../middleware/logging.middleware.js';

// In-memory storage for security settings (in production, use database)
let securitySettings = {
    rateLimitWindow: 15,
    rateLimitRequests: 100,
    jwtExpiry: 24,
    passwordMinLength: 8,
    requireEmailVerification: false,
    enableTwoFactor: false,
    sessionTimeout: 30
};

// Clear all caches
export const clearAllCaches = async (req, res) => {
    try {
        const isConnected = await ensureRedisConnection();
        
        if (!isConnected) {
            return res.status(200).json({
                message: 'Redis is not connected, cache clearing skipped',
                success: true,
                redisConnected: false
            });
        }

        // Get all cache keys
        const allKeys = await client.keys('*');
        
        if (allKeys.length > 0) {
            await client.del(allKeys);
        }

        res.status(200).json({
            message: `Successfully cleared ${allKeys.length} cache entries`,
            success: true,
            redisConnected: true,
            clearedKeys: allKeys.length
        });
    } catch (error) {
        console.error('Error clearing all caches:', error);
        res.status(500).json({
            message: 'Failed to clear caches',
            error: error.message,
            success: false
        });
    }
};

// Clear specific cache types
export const clearSpecificCache = async (req, res) => {
    try {
        const { cacheType } = req.params;
        const isConnected = await ensureRedisConnection();
        
        if (!isConnected) {
            return res.status(200).json({
                message: 'Redis is not connected, cache clearing skipped',
                success: true,
                redisConnected: false
            });
        }

        let pattern;
        switch (cacheType) {
            case 'products':
                pattern = 'products:*';
                break;
            case 'categories':
                pattern = 'categories:*';
                break;
            case 'featuredProducts':
                pattern = 'featuredProducts';
                break;
            default:
                return res.status(400).json({
                    message: 'Invalid cache type. Use: products, categories, or featuredProducts',
                    success: false
                });
        }

        const keys = await client.keys(pattern);
        
        if (keys.length > 0) {
            await client.del(keys);
        }

        res.status(200).json({
            message: `Successfully cleared ${keys.length} ${cacheType} cache entries`,
            success: true,
            redisConnected: true,
            clearedKeys: keys.length,
            cacheType
        });
    } catch (error) {
        console.error(`Error clearing ${req.params.cacheType} cache:`, error);
        res.status(500).json({
            message: `Failed to clear ${req.params.cacheType} cache`,
            error: error.message,
            success: false
        });
    }
};

// Get cache statistics
export const getCacheStats = async (req, res) => {
    try {
        const isConnected = await ensureRedisConnection();
        
        if (!isConnected) {
            return res.status(200).json({
                message: 'Redis is not connected',
                redisConnected: false,
                stats: null
            });
        }

        // Get cache statistics
        const allKeys = await client.keys('*');
        const productKeys = await client.keys('products:*');
        const categoryKeys = await client.keys('categories:*');
        const featuredKeys = await client.keys('featuredProducts');

        // Get Redis info
        const info = await client.info('memory');
        const memoryUsage = info.split('\r\n').find(line => line.startsWith('used_memory_human:'));

        res.status(200).json({
            message: 'Cache statistics retrieved successfully',
            redisConnected: true,
            stats: {
                totalKeys: allKeys.length,
                productCacheKeys: productKeys.length,
                categoryCacheKeys: categoryKeys.length,
                featuredProductKeys: featuredKeys.length,
                memoryUsage: memoryUsage ? memoryUsage.split(':')[1] : 'Unknown'
            }
        });
    } catch (error) {
        console.error('Error getting cache stats:', error);
        res.status(500).json({
            message: 'Failed to get cache statistics',
            error: error.message,
            redisConnected: false
        });
    }
};

// Get database statistics
export const getDatabaseStats = async (req, res) => {
    try {
        const mongoose = await import('mongoose');
        
        // Get connection status
        const connectionState = mongoose.default.connection.readyState;
        const connectionStates = {
            0: 'Disconnected',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting',
            99: 'Uninitialized'
        };

        // Import models for collection stats
        const { default: Product } = await import('../models/product.model.js');
        const { default: User } = await import('../models/user.model.js');
        const { default: Order } = await import('../models/order.model.js');
        const { default: Category } = await import('../models/category.model.js');
        const { default: Coupon } = await import('../models/coupon.model.js');

        // Get collection counts
        const [
            productCount,
            userCount,
            orderCount,
            categoryCount,
            couponCount
        ] = await Promise.all([
            Product.countDocuments(),
            User.countDocuments(),
            Order.countDocuments(),
            Category.countDocuments(),
            Coupon.countDocuments()
        ]);

        // Get recent activity (orders from last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentOrders = await Order.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        const recentUsers = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Get total sales amount
        const salesData = await Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
        ]);

        const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;

        // Get database name and host
        const dbName = mongoose.default.connection.db?.databaseName || 'Unknown';
        const dbHost = mongoose.default.connection.host || 'Unknown';

        res.status(200).json({
            message: 'Database statistics retrieved successfully',
            stats: {
                connection: {
                    status: connectionStates[connectionState] || 'Unknown',
                    database: dbName,
                    host: dbHost
                },
                collections: {
                    products: productCount,
                    users: userCount,
                    orders: orderCount,
                    categories: categoryCount,
                    coupons: couponCount,
                    total: productCount + userCount + orderCount + categoryCount + couponCount
                },
                activity: {
                    recentOrders: recentOrders,
                    recentUsers: recentUsers,
                    totalSales: totalSales,
                    period: '30 days'
                }
            }
        });
    } catch (error) {
        console.error('Error getting database stats:', error);
        res.status(500).json({
            message: 'Failed to get database statistics',
            error: error.message
        });
    }
};

// Get security statistics and settings
export const getSecurityStats = async (req, res) => {
    try {
        const mongoose = await import('mongoose');
        
        // Import models
        const { default: User } = await import('../models/user.model.js');
        const { default: Order } = await import('../models/order.model.js');

        // Get security-related statistics
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            adminUsers,
            recentLogins24h,
            recentRegistrations24h,
            recentOrders24h,
            suspiciousActivity
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ lastLogin: { $gte: last24Hours } }),
            User.countDocuments({ createdAt: { $gte: last24Hours } }),
            Order.countDocuments({ createdAt: { $gte: last24Hours } }),
            // Check for suspicious activity (multiple failed attempts, unusual patterns)
            User.countDocuments({ 
                failedLoginAttempts: { $gte: 5 },
                lastFailedLogin: { $gte: last24Hours }
            })
        ]);

        // Get weekly trends
        const weeklyStats = await Promise.all([
            User.countDocuments({ createdAt: { $gte: last7Days } }),
            Order.countDocuments({ createdAt: { $gte: last7Days } }),
            User.countDocuments({ lastLogin: { $gte: last7Days } })
        ]);        // Security configuration status
        const securityConfig = {
            helmet: process.env.NODE_ENV === 'production' ? 'enabled' : 'development',
            cors: 'configured',
            rateLimit: 'active',
            jwtExpiry: `${securitySettings.jwtExpiry}h`,
            passwordPolicy: 'enforced',
            adminProtection: 'active',
            dataValidation: 'comprehensive',
            // Frontend expected properties
            jwtConfigured: !!(process.env.ACCESS_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET),
            rateLimitEnabled: true,
            inputValidation: true,
            // Dynamic settings
            rateLimitWindow: securitySettings.rateLimitWindow,
            rateLimitRequests: securitySettings.rateLimitRequests,
            passwordMinLength: securitySettings.passwordMinLength
        };// Environment security check
        const envSecurity = {
            nodeEnv: process.env.NODE_ENV || 'development',
            httpsRedirect: process.env.NODE_ENV === 'production',
            // Frontend expected properties
            httpsEnabled: process.env.NODE_ENV === 'production',
            corsConfigured: true,
            secrets: {
                accessToken: !!process.env.ACCESS_TOKEN_SECRET,
                refreshToken: !!process.env.REFRESH_TOKEN_SECRET,
                mongoUri: !!process.env.MONGO_URI,
                redisUrl: !!process.env.REDIS_URL,
                stripeKey: !!process.env.STRIPE_SECRET_KEY,
                cloudinary: !!process.env.CLOUDINARY_API_SECRET
            }
        };

        res.status(200).json({
            message: 'Security statistics retrieved successfully',
            stats: {
                users: {
                    total: totalUsers,
                    admins: adminUsers,
                    recentLogins24h,
                    recentRegistrations24h,
                    weeklyRegistrations: weeklyStats[0],
                    weeklyLogins: weeklyStats[2]
                },
                activity: {
                    recentOrders24h,
                    weeklyOrders: weeklyStats[1],
                    suspiciousActivity
                },
                security: securityConfig,
                environment: envSecurity
            }
        });
    } catch (error) {
        console.error('Error getting security stats:', error);
        res.status(500).json({
            message: 'Failed to get security statistics',
            error: error.message
        });
    }
};

// Update security settings
export const updateSecuritySettings = async (req, res) => {
    try {
        const { setting, value } = req.body;
        
        // Define allowed security settings
        const allowedSettings = [
            'rateLimitWindow',
            'rateLimitRequests',
            'jwtExpiry',
            'passwordMinLength',
            'requireEmailVerification',
            'enableTwoFactor',
            'sessionTimeout'
        ];

        if (!allowedSettings.includes(setting)) {
            return res.status(400).json({
                message: 'Invalid security setting',
                allowedSettings
            });
        }

        // Validate the value based on the setting
        if (setting === 'passwordMinLength') {
            const numValue = parseInt(value);
            if (isNaN(numValue) || numValue < 4 || numValue > 20) {
                return res.status(400).json({
                    message: 'Password minimum length must be between 4 and 20 characters'
                });
            }
            securitySettings[setting] = numValue;
        } else if (setting === 'rateLimitWindow' || setting === 'rateLimitRequests' || setting === 'jwtExpiry' || setting === 'sessionTimeout') {
            const numValue = parseInt(value);
            if (isNaN(numValue) || numValue < 1) {
                return res.status(400).json({
                    message: `${setting} must be a positive number`
                });
            }
            securitySettings[setting] = numValue;
        } else {
            securitySettings[setting] = value;
        }

        res.status(200).json({
            message: `Security setting '${setting}' updated successfully`,
            setting,
            value: securitySettings[setting],
            allSettings: securitySettings
        });
    } catch (error) {
        console.error('Error updating security settings:', error);
        res.status(500).json({
            message: 'Failed to update security settings',
            error: error.message
        });
    }
};

// Get system logs (simulated for demo)
export const getSystemLogs = async (req, res) => {
    try {
        const { limit = 50, type = 'all' } = req.query;
        
        // In a real application, you'd fetch from a logging system
        const mockLogs = [
            {
                timestamp: new Date(),
                level: 'info',
                type: 'auth',
                message: 'User login successful',
                ip: '192.168.1.100',
                userAgent: 'Mozilla/5.0...'
            },
            {
                timestamp: new Date(Date.now() - 300000),
                level: 'warn',
                type: 'security',
                message: 'Rate limit exceeded',
                ip: '192.168.1.101',
                userAgent: 'Bot/1.0'
            },
            {
                timestamp: new Date(Date.now() - 600000),
                level: 'error',
                type: 'database',
                message: 'Connection timeout',
                ip: 'internal',
                userAgent: 'server'
            },
            {
                timestamp: new Date(Date.now() - 900000),
                level: 'info',
                type: 'admin',
                message: 'Admin action: Product created',
                ip: '192.168.1.102',
                userAgent: 'Mozilla/5.0...'
            }
        ];

        const filteredLogs = type === 'all' 
            ? mockLogs 
            : mockLogs.filter(log => log.type === type);

        res.status(200).json({
            message: 'System logs retrieved successfully',
            logs: filteredLogs.slice(0, parseInt(limit)),
            total: filteredLogs.length,
            types: ['all', 'auth', 'security', 'database', 'admin', 'error']
        });
    } catch (error) {
        console.error('Error getting system logs:', error);
        res.status(500).json({
            message: 'Failed to get system logs',
            error: error.message
        });
    }
};

// Get public password requirements (no auth required)
export const getPasswordRequirements = async (req, res) => {
    try {
        res.status(200).json({
            passwordMinLength: securitySettings.passwordMinLength,
            message: 'Password requirements retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting password requirements:', error);
        res.status(500).json({
            message: 'Failed to get password requirements',
            error: error.message
        });
    }
};

// Get security health status
export const getSecurityHealth = async (req, res) => {
    try {
        const healthStatus = await securityHealthCheck();
        
        res.status(200).json({
            health: healthStatus,
            message: 'Security health status retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting security health:', error);
        res.status(500).json({
            message: 'Failed to get security health status',
            error: error.message
        });
    }
};

// Get security events
export const getSecurityEvents = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const events = await securityLogger.getRecentEvents(limit);
        
        res.status(200).json({
            events,
            count: events.length,
            message: 'Security events retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting security events:', error);
        res.status(500).json({
            message: 'Failed to get security events',
            error: error.message
        });
    }
};

// Get IP blacklist
export const getBlacklist = async (req, res) => {
    try {
        const blacklist = await manageIPBlacklist.getBlacklist();
        
        res.status(200).json({
            blacklist,
            count: blacklist.length,
            message: 'IP blacklist retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting blacklist:', error);
        res.status(500).json({
            message: 'Failed to get IP blacklist',
            error: error.message
        });
    }
};

// Add IP to blacklist
export const addToBlacklist = async (req, res) => {
    try {
        const { ip, reason } = req.body;
        
        if (!ip) {
            return res.status(400).json({
                message: 'IP address is required'
            });
        }

        // Validate IP format
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(ip)) {
            return res.status(400).json({
                message: 'Invalid IP address format'
            });
        }

        const result = await manageIPBlacklist.addIP(ip, reason || 'Manual addition');
        
        if (result.success) {
            res.status(200).json({
                message: result.message,
                success: true
            });
        } else {
            res.status(500).json({
                message: result.error,
                success: false
            });
        }
    } catch (error) {
        console.error('Error adding IP to blacklist:', error);
        res.status(500).json({
            message: 'Failed to add IP to blacklist',
            error: error.message
        });
    }
};

// Remove IP from blacklist
export const removeFromBlacklist = async (req, res) => {
    try {
        const { ip } = req.params;
        
        if (!ip) {
            return res.status(400).json({
                message: 'IP address is required'
            });
        }

        const result = await manageIPBlacklist.removeIP(ip);
        
        if (result.success) {
            res.status(200).json({
                message: result.message,
                success: true
            });
        } else {
            res.status(500).json({
                message: result.error,
                success: false
            });
        }
    } catch (error) {
        console.error('Error removing IP from blacklist:', error);
        res.status(500).json({
            message: 'Failed to remove IP from blacklist',
            error: error.message
        });
    }
};
