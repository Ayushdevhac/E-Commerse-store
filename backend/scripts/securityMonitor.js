import { securityLogger, SECURITY_EVENTS } from '../middleware/logging.middleware.js';
import { client } from '../lib/redis.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SecurityMonitor {
    constructor() {
        // Check if we're in a serverless environment
        if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
            this.logsDir = null; // Disable file operations in serverless
            console.log('📝 Security Monitor running in serverless mode - Redis only');
        } else {
            this.logsDir = path.join(__dirname, '..', 'logs');
        }
    }

    // Ensure Redis connection
    async connectRedis() {
        try {
            if (!client.isOpen) {
                await client.connect();
            }
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }    // Get recent security alerts
    async getRecentAlerts(hours = 24) {
        try {
            await this.connectRedis();
            const events = await securityLogger.getRecentEvents(1000);
            const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
            
            const recentEvents = events.filter(event => 
                new Date(event.timestamp) > cutoffTime
            );

            const alertTypes = [
                SECURITY_EVENTS.SQL_INJECTION_ATTEMPT,
                SECURITY_EVENTS.XSS_ATTEMPT,
                SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
                SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
                SECURITY_EVENTS.DATA_BREACH_ATTEMPT
            ];

            const alerts = recentEvents.filter(event => 
                alertTypes.includes(event.eventType)
            );

            return {
                totalAlerts: alerts.length,
                alertsByType: this.groupByType(alerts),
                alertsByIP: this.groupByIP(alerts),
                recentAlerts: alerts.slice(0, 10),
                timeRange: `${hours} hours`
            };
        } catch (error) {
            console.error('Error fetching recent alerts:', error);
            return null;
        }
    }    // Analyze patterns in security events
    async analyzePatterns() {
        try {
            await this.connectRedis();
            const events = await securityLogger.getRecentEvents(5000);
            const analysis = {
                totalEvents: events.length,
                timeRange: 'Last 5000 events',
                patterns: {
                    repeatingIPs: this.findRepeatingIPs(events),
                    suspiciousUserAgents: this.findSuspiciousUserAgents(events),
                    attackPatterns: this.findAttackPatterns(events),
                    timeDistribution: this.analyzeTimeDistribution(events)
                }
            };

            return analysis;
        } catch (error) {
            console.error('Error analyzing patterns:', error);
            return null;
        }
    }    // Clear false positive alerts
    async clearFalsePositives() {
        try {
            await this.connectRedis();
            const events = await client.lRange('security_events', 0, -1);
            const filteredEvents = [];

            for (const eventStr of events) {
                const event = JSON.parse(eventStr);
                
                // Skip likely false positives
                if (this.isLikelyFalsePositive(event)) {
                    console.log(`Removing false positive: ${event.eventType} from ${event.ip}`);
                    continue;
                }
                
                filteredEvents.push(eventStr);
            }

            // Replace the list with filtered events
            await client.del('security_events');
            if (filteredEvents.length > 0) {
                await client.lPush('security_events', ...filteredEvents);
            }

            console.log(`Removed ${events.length - filteredEvents.length} false positives`);
            return {
                removedCount: events.length - filteredEvents.length,
                remainingCount: filteredEvents.length
            };
        } catch (error) {
            console.error('Error clearing false positives:', error);
            return null;
        }
    }

    // Check if an event is likely a false positive
    isLikelyFalsePositive(event) {
        // Development environment localhost requests
        if (process.env.NODE_ENV === 'development' && 
            (event.ip === '127.0.0.1' || event.ip === '::1' || event.ip?.includes('localhost'))) {
            return true;
        }

        // SQL injection alerts that are too generic
        if (event.eventType === SECURITY_EVENTS.SQL_INJECTION_ATTEMPT) {
            const details = event.details;
            if (details?.threats) {
                // Check if it's just isolated keywords without injection context
                const threatPatterns = details.threats.map(t => t.pattern);
                const hasGenericPattern = threatPatterns.some(pattern => 
                    pattern === '(\\bSELECT\\b|\\bUNION\\b|\\bINSERT\\b|\\bDELETE\\b|\\bDROP\\b|\\bCREATE\\b)'
                );
                
                if (hasGenericPattern && !this.hasActualInjectionContext(details)) {
                    return true;
                }
            }
        }

        return false;
    }

    // Check if the request data actually contains injection context
    hasActualInjectionContext(details) {
        const requestData = JSON.stringify(details.requestData || {});
        
        // Look for actual SQL injection patterns, not just keywords
        const injectionPatterns = [
            /SELECT.*FROM/i,
            /UNION.*SELECT/i,
            /OR.*=.*OR/i,
            /'\s*OR\s*'1'='1'/i,
            /;\s*DROP/i,
            /;\s*DELETE/i
        ];

        return injectionPatterns.some(pattern => pattern.test(requestData));
    }

    // Helper methods for analysis
    groupByType(events) {
        const grouped = {};
        events.forEach(event => {
            grouped[event.eventType] = (grouped[event.eventType] || 0) + 1;
        });
        return grouped;
    }

    groupByIP(events) {
        const grouped = {};
        events.forEach(event => {
            grouped[event.ip] = (grouped[event.ip] || 0) + 1;
        });
        return Object.entries(grouped)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
    }

    findRepeatingIPs(events) {
        const ipCounts = {};
        events.forEach(event => {
            ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
        });

        return Object.entries(ipCounts)
            .filter(([, count]) => count > 50)
            .sort(([,a], [,b]) => b - a);
    }

    findSuspiciousUserAgents(events) {
        const userAgents = {};
        events.forEach(event => {
            if (event.userAgent && event.userAgent !== 'unknown') {
                userAgents[event.userAgent] = (userAgents[event.userAgent] || 0) + 1;
            }
        });

        const suspicious = Object.entries(userAgents)
            .filter(([ua]) => {
                const suspiciousPatterns = [
                    /bot/i, /crawler/i, /spider/i, /scraper/i,
                    /curl/i, /wget/i, /postman/i, /python/i
                ];
                return suspiciousPatterns.some(pattern => pattern.test(ua));
            })
            .sort(([,a], [,b]) => b - a);

        return suspicious.slice(0, 10);
    }

    findAttackPatterns(events) {
        const patterns = {};
        events.forEach(event => {
            if (event.details?.threats) {
                event.details.threats.forEach(threat => {
                    patterns[threat.type] = (patterns[threat.type] || 0) + 1;
                });
            }
        });

        return patterns;
    }

    analyzeTimeDistribution(events) {
        const hours = {};
        events.forEach(event => {
            const hour = new Date(event.timestamp).getHours();
            hours[hour] = (hours[hour] || 0) + 1;
        });

        return hours;
    }

    // Generate security report
    async generateReport() {
        console.log('🔒 Security Monitor Report');
        console.log('=' .repeat(50));

        const alerts = await this.getRecentAlerts(24);
        if (alerts) {
            console.log(`\n📊 Alerts in last 24 hours: ${alerts.totalAlerts}`);
            console.log('\nAlerts by type:');
            Object.entries(alerts.alertsByType).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });

            console.log('\nTop IPs:');
            alerts.alertsByIP.forEach(([ip, count]) => {
                console.log(`  ${ip}: ${count}`);
            });
        }

        const patterns = await this.analyzePatterns();
        if (patterns) {
            console.log(`\n🔍 Pattern Analysis (${patterns.totalEvents} events)`);
            console.log('\nAttack patterns:');
            Object.entries(patterns.patterns.attackPatterns).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });

            console.log('\nRepeating IPs (>50 events):');
            patterns.patterns.repeatingIPs.forEach(([ip, count]) => {
                console.log(`  ${ip}: ${count}`);
            });
        }

        console.log('\n' + '=' .repeat(50));
    }
}

// CLI interface
const monitor = new SecurityMonitor();

if (process.argv.includes('--report')) {
    monitor.generateReport().then(() => process.exit(0));
} else if (process.argv.includes('--clean')) {
    monitor.clearFalsePositives().then((result) => {
        if (result) {
            console.log(`✅ Cleaned ${result.removedCount} false positives, ${result.remainingCount} events remaining`);
        }
        process.exit(0);
    });
} else if (process.argv.includes('--alerts')) {
    const hours = process.argv.includes('--hours') ? 
        parseInt(process.argv[process.argv.indexOf('--hours') + 1]) || 24 : 24;
    
    monitor.getRecentAlerts(hours).then((alerts) => {
        if (alerts) {
            console.log(`📋 Recent alerts (${hours}h):`, JSON.stringify(alerts, null, 2));
        }
        process.exit(0);
    });
} else {
    console.log('🔒 Security Monitor');
    console.log('Usage:');
    console.log('  node securityMonitor.js --report     # Generate full security report');
    console.log('  node securityMonitor.js --clean      # Clean false positive alerts');
    console.log('  node securityMonitor.js --alerts     # Show recent alerts');
    console.log('  node securityMonitor.js --alerts --hours 6  # Show alerts from last 6 hours');
}

export { SecurityMonitor };
