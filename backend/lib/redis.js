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
  try {
    // Check if client is already open
    if (client.isOpen) {
      isConnected = true;
      return true;
    }
    
    await client.connect();
    isConnected = true;
    console.log("Redis connected successfully");
    return true;
  } catch (error) {
    console.error("Redis connection error:", error);
    isConnected = false;
    return false;
  }
};

export const disconnectRedis = async () => {
  if (isConnected && client.isOpen) {
    try {
      await client.quit();
      isConnected = false;
      console.log("Redis disconnected successfully");
    } catch (error) {
      console.error("Redis disconnection error:", error);
    }
  }
};

// Ensure connection is available for operations (serverless-friendly)
export const ensureRedisConnection = async () => {
  try {
    // For serverless, always check if client is open
    if (!client.isOpen) {
      await connectRedis();
    }
    return client.isOpen;
  } catch (error) {
    console.error("Error ensuring Redis connection:", error);
    return false;
  }
};