import { client, ensureRedisConnection } from '../lib/redis.js';
import crypto from 'crypto';

// Initialize security settings and API keys
export const initializeSecurity = async () => {
    try {
        console.log('Initializing security settings...');
        
        await ensureRedisConnection();
        
        // Generate and store master API key
        const masterApiKey = process.env.API_KEY_MASTER || crypto.randomBytes(32).toString('hex');
        await client.setEx(`api_key:${masterApiKey}`, 86400 * 365, JSON.stringify({
            name: 'Master API Key',
            permissions: ['read', 'write', 'admin'],
            created: new Date().toISOString(),
            usage: 0
        }));

        // Initialize security blacklists
        const maliciousIPs = [
            // Add known malicious IPs here
        ];

        for (const ip of maliciousIPs) {
            await client.sAdd('blacklisted_ips', ip);
        }

        // Initialize rate limit settings
        await client.setEx('security_settings:rate_limits', 86400, JSON.stringify({
            api: { windowMs: 15 * 60 * 1000, max: 1000 },
            auth: { windowMs: 15 * 60 * 1000, max: 10 },
            admin: { windowMs: 15 * 60 * 1000, max: 500 },
            upload: { windowMs: 60 * 60 * 1000, max: 50 }
        }));

        // Initialize security monitoring
        await client.setEx('security_monitoring:enabled', 86400, 'true');

        console.log('Security initialization completed successfully');
        console.log(`Master API Key: ${masterApiKey}`);
        
        return {
            success: true,
            masterApiKey,
            message: 'Security settings initialized'
        };
    } catch (error) {
        console.error('Security initialization failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Security health check
export const securityHealthCheck = async () => {
    try {
        const checks = {
            redis: false,
            rateLimiting: false,
            apiKeys: false,
            monitoring: false,
            blacklists: false
        };

        // Check Redis connection
        try {
            await client.ping();
            checks.redis = true;
        } catch (error) {
            console.warn('Redis security check failed:', error.message);
        }        // Check rate limiting settings
        try {
            const rateLimits = await client.get('security_settings:rate_limits');
            checks.rateLimiting = !!rateLimits;
        } catch (error) {
            console.warn('Rate limiting check failed:', error.message);
        }

        // Check API keys
        try {
            const keys = await client.keys('api_key:*');
            checks.apiKeys = keys.length > 0;
        } catch (error) {
            console.warn('API keys check failed:', error.message);
        }

        // Check monitoring
        try {
            const monitoring = await client.get('security_monitoring:enabled');
            checks.monitoring = monitoring === 'true';
        } catch (error) {
            console.warn('Monitoring check failed:', error.message);
        }

        // Check blacklists
        try {
            const blacklistSize = await client.sCard('blacklisted_ips');
            checks.blacklists = blacklistSize >= 0;
        } catch (error) {
            console.warn('Blacklist check failed:', error.message);
        }

        const allPassing = Object.values(checks).every(check => check === true);
        
        return {
            status: allPassing ? 'HEALTHY' : 'WARNING',
            checks,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Security health check failed:', error);
        return {
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

// IP blacklist management
export const manageIPBlacklist = {    async addIP(ip, reason = 'Manual addition') {
        try {
            await ensureRedisConnection();
            await client.sAdd('blacklisted_ips', ip);
            await client.setEx(`blacklist_reason:${ip}`, 86400 * 30, JSON.stringify({
                reason,
                timestamp: new Date().toISOString(),
                addedBy: 'system'
            }));
            console.log(`IP ${ip} added to blacklist: ${reason}`);
            return { success: true, message: `IP ${ip} blacklisted` };
        } catch (error) {
            console.error('Error adding IP to blacklist:', error);
            return { success: false, error: error.message };
        }
    },

    async removeIP(ip) {
        try {
            await client.sRem('blacklisted_ips', ip);
            await client.del(`blacklist_reason:${ip}`);
            console.log(`IP ${ip} removed from blacklist`);
            return { success: true, message: `IP ${ip} removed from blacklist` };
        } catch (error) {
            console.error('Error removing IP from blacklist:', error);
            return { success: false, error: error.message };
        }
    },    async isBlacklisted(ip) {
        try {
            await ensureRedisConnection();
            const result = await client.sIsMember('blacklisted_ips', ip);
            return result === true;
        } catch (error) {
            console.error('Error checking IP blacklist:', error);
            return false;
        }
    },

    async getBlacklist() {
        try {
            const ips = await client.sMembers('blacklisted_ips');
            const blacklist = [];
            
            for (const ip of ips) {
                const reasonData = await client.get(`blacklist_reason:${ip}`);
                let reason = 'Unknown';
                let timestamp = null;
                
                if (reasonData) {
                    try {
                        const parsed = JSON.parse(reasonData);
                        reason = parsed.reason;
                        timestamp = parsed.timestamp;
                    } catch (e) {
                        reason = reasonData;
                    }
                }
                
                blacklist.push({ ip, reason, timestamp });
            }
            
            return blacklist;
        } catch (error) {
            console.error('Error getting blacklist:', error);
            return [];
        }
    }
};
