import rateLimit from 'express-rate-limit';
import { client } from '../lib/redis.js';

// Advanced rate limiting with user-specific limits
export const createAdvancedRateLimit = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        maxRequests = 100,
        maxPerUser = 50,
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
        message = 'Too many requests, please try again later'
    } = options;

    return rateLimit({
        windowMs,
        max: maxRequests,
        message: { message, code: 'RATE_LIMIT_EXCEEDED' },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        skipFailedRequests,        // More lenient in development
       
        keyGenerator: (req) => {
            // Use user ID if authenticated, otherwise IP
            return req.user?.id || req.ip;
        },
        handler: async (req, res) => {
            // Log rate limit violations
            console.warn(`Rate limit exceeded for ${req.user?.email || req.ip} on ${req.path}`);
              // Store rate limit violations in Redis for monitoring
            try {
                const key = `rate_limit_violation:${req.user?.id || req.ip}:${Date.now()}`;
                await client.setEx(key, 3600, JSON.stringify({
                    userId: req.user?.id,
                    ip: req.ip,
                    path: req.path,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                }));
            } catch (error) {
                console.error('Error storing rate limit violation:', error);
            }

            res.status(429).json({ 
                message, 
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.round(windowMs / 1000)
            });
        }
    });
};

// Endpoint-specific rate limits
export const authRateLimit = createAdvancedRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, //  200 auth attempts per window 
    message: 'Too many authentication attempts, please try again later'
});

export const apiRateLimit = createAdvancedRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 2000, // 2000 API calls per window (increased from 1000)
    message: 'API rate limit exceeded'
});

export const adminRateLimit = createAdvancedRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 2000, // 1000 admin calls per window (increased from 500)
    message: 'Admin API rate limit exceeded'
});

export const fileUploadRateLimit = createAdvancedRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 200, // 100 uploads per hour (increased from 50)
    message: 'File upload limit exceeded'
});
