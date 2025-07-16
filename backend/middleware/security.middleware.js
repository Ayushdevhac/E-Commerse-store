import crypto from 'crypto';
import { client, ensureRedisConnection } from '../lib/redis.js';

// Generate API key for client applications
export const generateAPIKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Validate API key middleware
export const validateAPIKey = async (req, res, next) => {
    try {
        // Skip API key validation for public routes
        if (isPublicRoute(req.method, req.path)) {
            return next();
        }

        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({ 
                message: 'API key required',
                code: 'API_KEY_MISSING'
            });
        }

        // Validate API key format
        if (!/^[a-f0-9]{64}$/.test(apiKey)) {
            return res.status(401).json({ 
                message: 'Invalid API key format',
                code: 'INVALID_API_KEY'
            });
        }        // Check if API key is valid (store valid keys in Redis)
        await ensureRedisConnection();
        const isValid = await client.exists(`api_key:${apiKey}`);
        
        if (!isValid) {
            console.warn(`Invalid API key attempted: ${apiKey.substring(0, 8)}...`);
            return res.status(401).json({ 
                message: 'Invalid API key',
                code: 'INVALID_API_KEY'
            });
        }

        // Track API key usage
        await client.incr(`api_key_usage:${apiKey}:${new Date().toISOString().split('T')[0]}`);
        await client.expire(`api_key_usage:${apiKey}:${new Date().toISOString().split('T')[0]}`, 86400);

        req.apiKey = apiKey;
        next();
    } catch (error) {
        console.error('API key validation error:', error);
        res.status(500).json({ 
            message: 'API key validation failed',
            code: 'API_KEY_ERROR'
        });
    }
};

// Define public routes that don't require origin validation or API keys
const PUBLIC_ROUTES = [
    // Authentication routes
    { method: 'POST', path: /^\/auth\/signup$/ },
    { method: 'POST', path: /^\/auth\/login$/ },
    { method: 'POST', path: /^\/auth\/logout$/ },
    { method: 'GET', path: /^\/auth\/profile$/ },
    { method: 'POST', path: /^\/auth\/refresh-token$/ },
    
    // Product browsing routes (GET only) - paths are relative to /api
    { method: 'GET', path: /^\/products$/ },
    { method: 'GET', path: /^\/products\/featured$/ },
    { method: 'GET', path: /^\/products\/search/ },
    { method: 'GET', path: /^\/products\/categories$/ },
    { method: 'GET', path: /^\/products\/category\// },
    { method: 'GET', path: /^\/products\/recommendations$/ },
    { method: 'GET', path: /^\/products\/[a-fA-F0-9]{24}$/ }, // Product by ID
    
    // Category routes
    { method: 'GET', path: /^\/categories$/ },
    { method: 'GET', path: /^\/categories\/[^\/]+$/ },
    
    // Public review routes
    { method: 'GET', path: /^\/reviews\/product\/[a-fA-F0-9]{24}$/ }, // Product reviews
      // Public health/status endpoints
    { method: 'GET', path: /^\/health$/ },
    { method: 'GET', path: /^\/status$/ },
    
    // Payment success callback (called after Stripe redirect)
    { method: 'POST', path: /^\/payments\/checkout-success$/ }
];

// Routes that require authentication but not API keys (for authenticated web users)
const AUTHENTICATED_ROUTES = [
    // Payment routes for authenticated users (except checkout-success which is public)
    { method: 'POST', path: /^\/payments\/create-checkout-session$/ },
      // Cart routes
    { method: 'GET', path: /^\/cart$/ },
    { method: 'POST', path: /^\/cart$/ },
    { method: 'DELETE', path: /^\/cart$/ },
    { method: 'PUT', path: /^\/cart\/[a-fA-F0-9]{24}$/ },
    
    // Wishlist routes
    { method: 'GET', path: /^\/wishlist$/ },
    { method: 'POST', path: /^\/wishlist\/add$/ },
    { method: 'DELETE', path: /^\/wishlist\/[a-fA-F0-9]{24}$/ },
    { method: 'POST', path: /^\/wishlist\/toggle$/ },
    
    // User profile routes
    { method: 'PUT', path: /^\/auth\/profile$/ },
      // Order routes
    { method: 'GET', path: /^\/orders$/ },
    { method: 'GET', path: /^\/orders\/[a-fA-F0-9]{24}$/ },
    { method: 'GET', path: /^\/orders\/my-orders$/ },
    { method: 'GET', path: /^\/orders\/admin\/all$/ },
    { method: 'POST', path: /^\/orders$/ },
    { method: 'PUT', path: /^\/orders\/[a-fA-F0-9]{24}$/ },    // Review routes for authenticated users
    { method: 'POST', path: /^\/reviews$/ },
    { method: 'PUT', path: /^\/reviews\/[a-fA-F0-9]{24}$/ },
    { method: 'DELETE', path: /^\/reviews\/[a-fA-F0-9]{24}$/ },
    { method: 'GET', path: /^\/reviews\/user$/ },
    { method: 'GET', path: /^\/reviews\/my-reviews$/ },
    { method: 'GET', path: /^\/reviews\/reviewable-products$/ },
    
    // Admin routes for authenticated users
    { method: 'GET', path: /^\/admin\/database\/stats$/ },
    { method: 'GET', path: /^\/admin\/cache\/stats$/ },
    { method: 'GET', path: /^\/admin\/security\/stats$/ },
    { method: 'GET', path: /^\/admin\/security\/logs$/ },
    { method: 'GET', path: /^\/admin\/analytics$/ },
    { method: 'POST', path: /^\/admin\/products$/ },
    { method: 'PUT', path: /^\/admin\/products\/[a-fA-F0-9]{24}$/ },
    { method: 'DELETE', path: /^\/admin\/products\/[a-fA-F0-9]{24}$/ }
];

// Check if a route is public
export const isPublicRoute = (method, path) => {
    return PUBLIC_ROUTES.some(route => 
        route.method === method && route.path.test(path)
    );
};

// Check if a route is for authenticated users (requires auth but not API key)
export const isAuthenticatedRoute = (method, path) => {
    return AUTHENTICATED_ROUTES.some(route => 
        route.method === method && route.path.test(path)
    );
};

// Origin validation middleware - Ensures requests come from your website only
export const validateOrigin = (req, res, next) => {
    // Skip origin validation for public routes
    if (isPublicRoute(req.method, req.path)) {
        return next();
    }

    // Special handling for checkout-success - completely skip all security checks
    // since users are coming from Stripe redirects
    if (req.path === '/payments/checkout-success') {
        console.log('Skipping all security checks for checkout-success endpoint');
        return next();
    }

    // For authenticated routes, allow if from trusted origin
    const isAuthRoute = isAuthenticatedRoute(req.method, req.path);

    // Extract raw origin or referer
    const rawOrigin = req.get('Origin') || req.get('Referer');
    // Parse to domain origin only (strip path)
    let hostOrigin;
    try {
        hostOrigin = new URL(rawOrigin).origin;
    } catch {
        hostOrigin = rawOrigin;
    }
    // ULTRA-PERMISSIVE: Accept ANY Vercel domain via suffix
    const isVercelDomain = hostOrigin.endsWith('.vercel.app');

    // Updated debug log
    console.log('Security middleware:', { url: req.originalUrl, hostOrigin, isVercelDomain });

    // Allow Vercel domains immediately
    if (isVercelDomain) return next();
    
    // Also check if this is the main production domain from CLIENT_URL
    if (origin && process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
        console.log('✅ Security middleware: Allowing CLIENT_URL domain:', origin);
        return next();
    }

    // Allow requests without origin for mobile apps, but require API key
    if (!origin) {
        // For authenticated routes without origin, still require API key
        return validateAPIKey(req, res, next);
    }

    // Extract domain from origin/referer
    let requestOrigin;
    try {
        requestOrigin = new URL(origin).origin;
    } catch (error) {
        return res.status(403).json({ 
            message: 'Invalid request origin',
            code: 'INVALID_ORIGIN'
        });
    }    // Check if origin is allowed
    const isAllowedOrigin = allowedOrigins.includes(requestOrigin) || isVercelDomain;
    
    if (!isAllowedOrigin) {
        console.warn(`Blocked request from unauthorized origin: ${requestOrigin}`);
        return res.status(403).json({ 
            message: 'Unauthorized origin',
            code: 'UNAUTHORIZED_ORIGIN'
        });
    }    // For authenticated routes from trusted origins, skip API key requirement
    if (isAuthRoute && (allowedOrigins.includes(requestOrigin) || isVercelDomain)) {
        return next();
    }

    // Additional security: Check for suspicious user agents
    const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /postman/i
    ];    // Allow legitimate browsers and mobile apps
    const legitPatterns = [
        /mozilla/i,
        /chrome/i,
        /safari/i,
        /firefox/i,
        /edge/i,
        /opera/i,
        /webkit/i,
        /android/i,
        /iphone/i,
        /ipad/i,
        /mobile/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    const isLegitimate = legitPatterns.some(pattern => pattern.test(userAgent));

    console.log('User agent check:', {
        userAgent: userAgent,
        isSuspicious: isSuspicious,
        isLegitimate: isLegitimate,
        origin: requestOrigin
    });

    // Only block if suspicious AND not legitimate (be more lenient)
    if (isSuspicious && !isLegitimate) {
        console.warn(`Blocked suspicious user agent: ${userAgent} from ${requestOrigin}`);
        return res.status(403).json({ 
            message: 'Unauthorized client',
            code: 'UNAUTHORIZED_CLIENT'
        });
    }

    next();
};

// Request fingerprinting for additional security
export const requestFingerprinting = async (req, res, next) => {
    try {
        await ensureRedisConnection();
        
        const fingerprint = crypto.createHash('sha256')
            .update(req.ip + req.get('User-Agent') + req.get('Accept-Language'))
            .digest('hex');

        req.fingerprint = fingerprint;

        // Track request patterns
        const key = `request_pattern:${fingerprint}:${new Date().toISOString().split('T')[0]}`;
        await client.incr(key);
        await client.expire(key, 86400);

        // Check for excessive requests from same fingerprint
        // Be more lenient with public routes (allow more requests)
        const requestCount = await client.get(key);
        const isPublic = isPublicRoute(req.method, req.path);
        const limit = isPublic ? 10000 : 5000; // Higher limit for public routes
        
        if (parseInt(requestCount) > limit) {
            console.warn(`Excessive requests from fingerprint: ${fingerprint} (${requestCount} requests, limit: ${limit})`);
            return res.status(429).json({ 
                message: 'Request limit exceeded for this client',
                code: 'CLIENT_LIMIT_EXCEEDED'
            });
        }

        next();
    } catch (error) {
        console.error('Request fingerprinting error:', error);
        next(); // Continue even if fingerprinting fails
    }
};

// CSRF protection middleware
export const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET requests and API key authenticated requests
    if (req.method === 'GET' || req.apiKey) {
        return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
        return res.status(403).json({ 
            message: 'CSRF token validation failed',
            code: 'CSRF_INVALID'
        });
    }

    next();
};
