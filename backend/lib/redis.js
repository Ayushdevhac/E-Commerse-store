import { createClient } from "redis"
import dotenv from "dotenv";
dotenv.config();

export const client = createClient({
  url: process.env.REDIS_URL
});

client.on("error", function(err) {
  console.error("Redis error:", err);
});

// Initialize connection
let isConnected = false;

export const connectRedis = async () => {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log("Redis connected successfully");
    } catch (error) {
      console.error("Redis connection error:", error);
      isConnected = false;
    }
  }
  return isConnected;
};

export const disconnectRedis = async () => {
  if (isConnected) {
    try {
      await client.quit();
      isConnected = false;
      console.log("Redis disconnected successfully");
    } catch (error) {
      console.error("Redis disconnection error:", error);
    }
  }
};

// Ensure connection is available for operations
export const ensureRedisConnection = async () => {
  if (!isConnected) {
    await connectRedis();
  }
  return isConnected;
};