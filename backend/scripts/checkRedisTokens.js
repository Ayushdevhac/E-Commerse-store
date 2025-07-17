import dotenv from 'dotenv';
import { client, ensureRedisConnection } from '../lib/redis.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkRedisTokens = async () => {
    try {
        console.log('🔌 Connecting to Redis...');
        const isConnected = await ensureRedisConnection();
        
        if (!isConnected) {
            console.log('❌ Could not connect to Redis');
            return;
        }
        
        console.log('✅ Connected to Redis');

        // List all refresh token keys
        const tokenKeys = await client.keys('refresh_token:*');
        console.log(`📊 Total refresh tokens in Redis: ${tokenKeys.length}`);
        
        if (tokenKeys.length === 0) {
            console.log('🚫 No refresh tokens found in Redis');
        } else {
            console.log('\n🔑 Current refresh tokens:');
            for (const key of tokenKeys) {
                const ttl = await client.ttl(key);
                const userId = key.replace('refresh_token:', '');
                console.log(`- User ${userId}: TTL ${ttl} seconds (${Math.round(ttl/3600)} hours)`);
            }
        }

        // Check for the specific user from the logs
        const specificUserId = '6877facbe0fda6b274b9bd27';
        const specificKey = `refresh_token:${specificUserId}`;
        const tokenExists = await client.exists(specificKey);
        
        console.log(`\n🔍 Checking specific user ${specificUserId}:`);
        console.log(`Token exists in Redis: ${tokenExists ? '✅ YES' : '❌ NO'}`);
        
        if (tokenExists) {
            const ttl = await client.ttl(specificKey);
            console.log(`TTL: ${ttl} seconds`);
        }

        // Clean up any expired tokens (optional)
        console.log('\n🧹 Cleaning up expired tokens...');
        let cleanedCount = 0;
        for (const key of tokenKeys) {
            const ttl = await client.ttl(key);
            if (ttl <= 0) {
                await client.del(key);
                cleanedCount++;
                console.log(`Deleted expired token: ${key}`);
            }
        }
        console.log(`Cleaned up ${cleanedCount} expired tokens`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (client) {
            await client.quit();
            console.log('🔌 Disconnected from Redis');
        }
    }
};

checkRedisTokens();
