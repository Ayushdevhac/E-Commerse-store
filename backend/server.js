import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import couponRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import wishlistRoutes from './routes/wishlist.route.js';
import reviewRoutes from './routes/review.route.js';
import vipRoutes from './routes/vip.route.js';
import orderRoutes from './routes/order.route.js';
import userRoutes from './routes/user.route.js';
import categoryRoutes from './routes/category.route.js';
import addressRoutes from './routes/address.route.js';
import adminRoutes from './routes/admin.route.js';
import feedbackRoutes from './routes/feedback.route.js';
import cookieParser from 'cookie-parser';
import { connectDB } from './lib/db.js';
import { connectRedis, disconnectRedis } from './lib/redis.js';
import { initStripe } from './lib/stripe.js';
import { initializeSecurity, securityHealthCheck, manageIPBlacklist } from './lib/security.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Enhanced Security Middleware
import { apiRateLimit, authRateLimit, adminRateLimit } from './middleware/rateLimiting.middleware.js';
import { validateOrigin, requestFingerprinting } from './middleware/security.middleware.js';
import { sanitizeInput } from './middleware/validation.middleware.js';
import { intrusionDetection, securityLogger, SECURITY_EVENTS } from './middleware/logging.middleware.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Stripe after environment variables are loaded
initStripe();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Enhanced Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Additional security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// Session configuration with enhanced security
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        touchAfter: 24 * 3600 // Lazy session update
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        sameSite: 'strict'
    },
    name: 'sessionId' // Change default session name
}));

// Origin validation - CRITICAL: APIs can only be called from your website
app.use('/api', validateOrigin);

// IP Blacklist checking
app.use('/api', async (req, res, next) => {
    try {
        const isBlacklisted = await manageIPBlacklist.isBlacklisted(req.ip);
        if (isBlacklisted) {
            await securityLogger.logSecurityEvent(SECURITY_EVENTS.UNAUTHORIZED_ACCESS, {
                reason: 'Blacklisted IP access attempt',
                ip: req.ip
            }, req);
            return res.status(403).json({ 
                message: 'Access denied',
                code: 'IP_BLACKLISTED'
            });
        }
        next();
    } catch (error) {
        console.error('Blacklist check error:', error);
        next(); // Continue even if blacklist check fails
    }
});

// Request fingerprinting for tracking
app.use(requestFingerprinting);

// Intrusion detection system
app.use(intrusionDetection);

// Input sanitization
app.use(sanitizeInput);

// Advanced rate limiting
app.use('/api', apiRateLimit);
app.use('/api/auth', authRateLimit);
app.use('/api/admin', adminRateLimit);

// CORS configuration with enhanced security
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
            process.env.CLIENT_URL,  // Production URL from env
            process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null, // Vercel URL
        ].filter(Boolean);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS: Blocked origin ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    maxAge: 86400 // 24 hours
}));

// Body parsing with size limits
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/vip", vipRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);

// Health check endpoint with detailed info
app.get("/api/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        message: "E-commerce server is running successfully",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        cpu: {
            usage: process.cpuUsage()
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        path: req.originalUrl 
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation error',
            errors: Object.values(error.errors).map(err => err.message)
        });
    }
    
    if (error.name === 'CastError') {
        return res.status(400).json({
            message: 'Invalid ID format'
        });
    }
    
    if (error.code === 11000) {
        return res.status(409).json({
            message: 'Duplicate entry error'
        });
    }
    
    res.status(500).json({ 
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await disconnectRedis();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await disconnectRedis();
    process.exit(0);
});

app.listen(PORT, async () => {
    console.log('Server is running on http://localhost:'+PORT);
    
    // Initialize core services
    await connectDB();
    await connectRedis();
    
    // Initialize security
    const securityInit = await initializeSecurity();
    if (securityInit.success) {
        console.log('✅ Security initialization completed');
        if (process.env.NODE_ENV === 'development') {
            console.log('🔐 Master API Key:', securityInit.masterApiKey);
        }
    } else {
        console.error('❌ Security initialization failed:', securityInit.error);
    }
    
    console.log('🚀 E-commerce server ready with enhanced security!');
});

