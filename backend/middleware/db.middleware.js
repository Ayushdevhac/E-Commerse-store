import { ensureDBConnection } from '../lib/db.js';

// Middleware to ensure database connection before handling requests
export const dbConnectionMiddleware = async (req, res, next) => {
    try {
        // Skip for non-DB routes like health checks
        if (req.path === '/health' || req.path === '/ping') {
            return next();
        }
        
        // Ensure database connection before proceeding
        await ensureDBConnection();
        next();
    } catch (error) {
        console.error('Database connection middleware error:', error);
        
        // Provide user-friendly error message
        if (error.message.includes('IP') || error.message.includes('whitelist')) {
            return res.status(503).json({
                success: false,
                message: 'Database temporarily unavailable. Please check IP whitelist settings.',
                error: 'Database connection failed'
            });
        }
        
        if (error.message.includes('authentication')) {
            return res.status(503).json({
                success: false,
                message: 'Database authentication failed.',
                error: 'Database connection failed'
            });
        }
        
        return res.status(503).json({
            success: false,
            message: 'Database temporarily unavailable. Please try again later.',
            error: 'Database connection failed'
        });
    }
};
