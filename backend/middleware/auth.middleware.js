import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';    
import User from '../models/user.model.js';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Rate limiting for authentication
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, //  1000 attempts per window 
    message: { message: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,

});

// Enhanced token validation with better security
export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        
        // Debug logging for serverless
        console.log('Auth Debug:', {
            hasToken: !!token,
            cookieKeys: Object.keys(req.cookies),
            hasSecret: !!process.env.ACCESS_TOKEN_SECRET
        });
        
        if (!token) {
            return res.status(401).json({ 
                message: 'Access token required', 
                code: 'TOKEN_MISSING' 
            });
        }

        // Verify token with additional security checks
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Check if token is expired (additional check)
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            return res.status(401).json({ 
                message: 'Token expired', 
                code: 'TOKEN_EXPIRED' 
            });
        }

        // Find user and check if account is still active
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                message: 'User not found or deactivated', 
                code: 'USER_NOT_FOUND' 
            });
        }

        // Add security headers
        res.set({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
        });

        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token', 
                code: 'TOKEN_INVALID' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired', 
                code: 'TOKEN_EXPIRED' 
            });
        }
        
        return res.status(500).json({ 
            message: 'Authentication error', 
            code: 'AUTH_ERROR' 
        });
    }
};

// Enhanced admin route with logging
export const adminRoute = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            message: 'Authentication required', 
            code: 'AUTH_REQUIRED' 
        });
    }

    if (req.user.role !== 'admin') {
        console.warn(`Unauthorized admin access attempt by user: ${req.user.email}`);
        return res.status(403).json({            message: 'Admin access required', 
            code: 'ADMIN_REQUIRED' 
        });
    }

    next();
};

// Input validation middleware
export const validateInput = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                message: 'Invalid input data', 
                details: error.details.map(detail => detail.message),
                code: 'VALIDATION_ERROR'
            });
        }
        next();
    };
};