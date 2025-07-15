import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { client } from '../lib/redis.js';
import { isPublicRoute } from './security.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Security event types
export const SECURITY_EVENTS = {
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INVALID_ORIGIN: 'INVALID_ORIGIN',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    ADMIN_ACCESS: 'ADMIN_ACCESS',
    DATA_BREACH_ATTEMPT: 'DATA_BREACH_ATTEMPT',
    FILE_UPLOAD: 'FILE_UPLOAD',
    SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
    XSS_ATTEMPT: 'XSS_ATTEMPT'
};

// Security logger class
class SecurityLogger {
    constructor() {
        this.logFile = path.join(logsDir, 'security.log');
        this.alertFile = path.join(logsDir, 'security-alerts.log');
    }

    // Log security event
    async logSecurityEvent(eventType, details, req = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            eventType,
            details,
            ip: req?.ip || 'unknown',
            userAgent: req?.get('User-Agent') || 'unknown',
            userId: req?.user?.id || null,
            userEmail: req?.user?.email || null,
            url: req?.originalUrl || null,
            method: req?.method || null,
            fingerprint: req?.fingerprint || null
        };

        // Write to log file
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(this.logFile, logLine);        // Store in Redis for real-time monitoring
        try {
            await client.lPush('security_events', JSON.stringify(logEntry));
            await client.lTrim('security_events', 0, 999); // Keep last 1000 events
            await client.expire('security_events', 86400 * 7); // Keep for 7 days
        } catch (error) {
            console.error('Error storing security event in Redis:', error);
        }

        // Log high-priority events to alerts file
        const highPriorityEvents = [
            SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
            SECURITY_EVENTS.DATA_BREACH_ATTEMPT,
            SECURITY_EVENTS.SQL_INJECTION_ATTEMPT,
            SECURITY_EVENTS.XSS_ATTEMPT,
            SECURITY_EVENTS.SUSPICIOUS_ACTIVITY
        ];

        if (highPriorityEvents.includes(eventType)) {
            fs.appendFileSync(this.alertFile, `ALERT: ${logLine}`);
            console.warn(`SECURITY ALERT: ${eventType}`, details);
        }

        // Console log for development
        if (process.env.NODE_ENV === 'development') {
            console.log(`Security Event: ${eventType}`, logEntry);
        }
    }    // Get recent security events
    async getRecentEvents(limit = 50) {
        try {
            const events = await client.lRange('security_events', 0, limit - 1);
            return events.map(event => JSON.parse(event));
        } catch (error) {
            console.error('Error fetching security events:', error);
            return [];
        }
    }

    // Get security statistics
    async getSecurityStats() {
        try {
            const events = await this.getRecentEvents(1000);
            const stats = {
                totalEvents: events.length,
                eventsByType: {},
                recentAlerts: [],
                topIPs: {},
                suspiciousIPs: []
            };

            events.forEach(event => {
                // Count by event type
                stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;

                // Count by IP
                stats.topIPs[event.ip] = (stats.topIPs[event.ip] || 0) + 1;

                // Collect recent alerts
                const highPriorityEvents = [
                    SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
                    SECURITY_EVENTS.DATA_BREACH_ATTEMPT,
                    SECURITY_EVENTS.SQL_INJECTION_ATTEMPT,
                    SECURITY_EVENTS.XSS_ATTEMPT
                ];

                if (highPriorityEvents.includes(event.eventType)) {
                    stats.recentAlerts.push(event);
                }
            });

            // Identify suspicious IPs (more than 100 events)
            Object.entries(stats.topIPs).forEach(([ip, count]) => {
                if (count > 100) {
                    stats.suspiciousIPs.push({ ip, count });
                }
            });

            return stats;
        } catch (error) {
            console.error('Error generating security stats:', error);
            return {};
        }
    }
}

// Create singleton instance
export const securityLogger = new SecurityLogger();

// Middleware to log security events
export const logSecurityEvent = (eventType, getDetails = () => ({})) => {
    return async (req, res, next) => {
        try {
            const details = typeof getDetails === 'function' ? getDetails(req) : getDetails;
            await securityLogger.logSecurityEvent(eventType, details, req);
        } catch (error) {
            console.error('Error logging security event:', error);
        }
        next();
    };
};

// Intrusion detection middleware
export const intrusionDetection = async (req, res, next) => {
    try {
        // Skip intrusion detection in development for localhost requests
        if (process.env.NODE_ENV === 'development' && 
            (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip?.includes('localhost'))) {
            return next();
        }

        // Normalize the path for public route checking
        const normalizedPath = req.path.startsWith('/api') ? req.path.substring(4) : req.path;
        
        // Be more lenient with public routes - only check for severe threats
        const isPublic = isPublicRoute(req.method, normalizedPath);        const suspiciousPatterns = [
            // More specific SQL Injection patterns (check for actual injection attempts, not just keywords)
            /(\bSELECT\b.*\bFROM\b|\bUNION\b.*\bSELECT\b)/i, // More specific SQL patterns
            /(\bOR\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?|\bAND\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i, // 1=1 style injections
            /('\s*OR\s*'1'\s*=\s*'1'|"\s*OR\s*"1"\s*=\s*"1")/i, // Classic OR '1'='1' injections
            /(;\s*(DROP|DELETE|UPDATE)\b)/i, // Command termination with dangerous commands
            /(\bEXEC\b|\bEXECUTE\b).*\(/i, // Execute commands
            /('.*;\s*(INSERT|UPDATE|DELETE).*'|".*;\s*(INSERT|UPDATE|DELETE).*")/i, // SQL commands in strings

            // XSS patterns (always check)
            /<script[^>]*>.*<\/script>/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe[^>]*>/i,

            // Path traversal (always check)
            /\.\.\//,
            /\.\.\\/,
            /%2e%2e%2f/i
        ];
        
        // Only add command injection patterns for protected routes and specific fields
        const commandInjectionPatterns = [
            /[\|;&`]\s*(rm|del|format|wget|curl|nc|netcat|bash|sh|cmd|powershell)\s/i,
            /\$\([^)]*\)/,
            /`[^`]*`/,
            /;\s*(rm|del|format|mkdir|rmdir)/i
        ];        // Get the data to check - exclude certain fields that commonly contain false positives
        const userInputData = {
            body: req.body,
            query: req.query,
            params: req.params
        };        // Filter out common false positive sources
        const excludeFromCheck = (obj, key, value) => {
            // Exclude JavaScript/CSS content, file uploads, encoded data
            if (typeof value === 'string') {
                // Skip base64 encoded data
                if (/^data:[^;]+;base64,/.test(value)) return true;
                // Skip if it looks like minified JS/CSS
                if (value.length > 1000 && /[{}();,]/.test(value)) return true;
                // Skip user agent strings
                if (key === 'user-agent' || key === 'userAgent') return true;
                // Skip referrer URLs
                if (key === 'referer' || key === 'referrer') return true;
                // Skip MongoDB sort parameters (like '-createdAt', '+name')
                if (key === 'sort' && /^[+-]?\w+$/.test(value)) return true;
                // Skip common query parameters
                if (['page', 'limit', 'offset', 'order', 'orderBy'].includes(key)) return true;
                // Skip MongoDB ObjectId patterns
                if (/^[a-fA-F0-9]{24}$/.test(value)) return true;
            }
            return false;
        };

        // Clean the data for checking
        const cleanDataForCheck = (obj) => {
            const cleaned = {};
            for (const [key, value] of Object.entries(obj || {})) {
                if (!excludeFromCheck(obj, key, value)) {
                    if (typeof value === 'object' && value !== null) {
                        cleaned[key] = cleanDataForCheck(value);
                    } else {
                        cleaned[key] = value;
                    }
                }
            }
            return cleaned;
        };        // Only check path and certain headers for protected routes
        const dataToCheck = isPublic ? cleanDataForCheck(userInputData) : {
            ...cleanDataForCheck(userInputData),
            path: req.path,
            referer: req.get('Referer'),
            customHeaders: Object.keys(req.headers)
                .filter(key => key.startsWith('x-') && key !== 'x-forwarded-for')
                .reduce((obj, key) => ({ ...obj, [key]: req.headers[key] }), {})
        };

        const checkString = JSON.stringify(dataToCheck);
        const threats = [];

        // Check basic suspicious patterns
        suspiciousPatterns.forEach((pattern, index) => {
            if (pattern.test(checkString)) {
                threats.push({
                    type: index < 3 ? 'SQL_INJECTION' : index < 7 ? 'XSS' : 'PATH_TRAVERSAL',
                    pattern: pattern.source
                });
            }
        });

        // Check command injection only for protected routes and only in specific contexts
        if (!isPublic) {
            commandInjectionPatterns.forEach(pattern => {
                if (pattern.test(checkString)) {
                    threats.push({
                        type: 'COMMAND_INJECTION',
                        pattern: pattern.source
                    });
                }
            });
        }

        if (threats.length > 0) {
            // Log the threat
            await securityLogger.logSecurityEvent(
                threats[0].type === 'SQL_INJECTION' ? SECURITY_EVENTS.SQL_INJECTION_ATTEMPT :
                threats[0].type === 'XSS' ? SECURITY_EVENTS.XSS_ATTEMPT :
                SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
                {
                    threats,
                    requestData: {
                        body: req.body,
                        query: req.query,
                        params: req.params
                    },
                    isPublicRoute: isPublic
                },
                req
            );            // Only block severe threats regardless of route type
            // For command injection on public routes, just log but don't block
            const severeThreats = threats.filter(t => 
                t.type === 'SQL_INJECTION' || t.type === 'XSS' || t.type === 'PATH_TRAVERSAL'
            );
            
            // Block if severe threats exist, or if command injection on protected routes
            const shouldBlock = severeThreats.length > 0 || 
                              (!isPublic && threats.some(t => t.type === 'COMMAND_INJECTION'));
            
            if (shouldBlock) {
                return res.status(403).json({
                    message: 'Suspicious activity detected',
                    code: 'THREAT_DETECTED'
                });
            }
        }

        next();
    } catch (error) {
        console.error('Error in intrusion detection:', error);
        next();
    }
};
