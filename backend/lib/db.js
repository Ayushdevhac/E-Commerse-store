import mongoose from "mongoose";

// Global connection for serverless reuse
let isConnected = false;

export const connectDB = async () => {
  try {
    // Validate that MONGO_URI is set
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    // If already connected in serverless environment, reuse connection
    if (isConnected && mongoose.connection.readyState === 1) {
      console.log('MongoDB: Reusing existing connection');
      return mongoose.connection;
    }    // Configure mongoose for serverless
    // Keep bufferCommands false to fail fast if not connected
    mongoose.set('bufferCommands', false);    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Serverless-optimized options for Atlas
      maxPoolSize: 1, // Minimal pool for serverless
      serverSelectionTimeoutMS: 10000, // Shorter timeout to fail faster
      socketTimeoutMS: 20000, // Shorter socket timeout
      connectTimeoutMS: 10000, // Shorter connection timeout
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority',
      maxIdleTimeMS: 5000, // Close connections after 5s of inactivity
      // Additional Atlas-specific options
      heartbeatFrequencyMS: 30000, // Less frequent heartbeats
      minPoolSize: 0, // Allow pool to shrink to 0 in serverless
    });

    // Wait for the connection to be truly ready
    await new Promise((resolve, reject) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        const timeout = setTimeout(() => {
          reject(new Error('Connection ready timeout'));
        }, 5000);
        
        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        mongoose.connection.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      }
    });

    isConnected = true;
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
    
    // Log connection state for debugging
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB Atlas');
      isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB Atlas');
      isConnected = false;
    });

    return conn;  } catch (error) {
    console.error(`MongoDB Atlas Connection Error: ${error.message}`);
    isConnected = false;
    
    // Specific error messages for common Atlas issues
    if (error.message.includes('Server selection timed out')) {
      console.error('🚨 MONGODB ATLAS SERVER SELECTION TIMEOUT:');
      console.error('1. Check MongoDB Atlas cluster is running (not paused)');
      console.error('2. Verify IP whitelist includes 0.0.0.0/0 in Network Access');
      console.error('3. Confirm connection string is correct');
      console.error('4. Check if Atlas cluster region is experiencing issues');
    }
    
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('🚨 IP WHITELIST ISSUE:');
      console.error('1. Go to MongoDB Atlas → Network Access');
      console.error('2. Add IP Address: 0.0.0.0/0 (Allow from anywhere)');
      console.error('3. Wait 2-3 minutes for changes to take effect');
      console.error('4. Redeploy your Vercel application');
    }
    
    if (error.message.includes('authentication')) {
      console.error('🚨 AUTHENTICATION ISSUE:');
      console.error('1. Check your MongoDB username and password');
      console.error('2. Verify the connection string is correct');
      console.error('3. Ensure user has proper database permissions');
    }
    
    // In serverless, don't exit the process immediately
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.error('⚠️ Running in serverless - DB connection failed but continuing');
      throw error; // Throw error so controllers can handle it
    }
    
    process.exit(1);
  }
}

// Helper function to ensure DB connection before operations
export const ensureDBConnection = async () => {
  try {
    // Check if we have a valid connection
    if (isConnected && mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    
    console.log('MongoDB: Establishing new connection...');
    await connectDB();
    
    // Wait for connection to be fully ready
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB: Waiting for connection to be ready...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout'));
        }, 10000); // 10 second timeout
        
        if (mongoose.connection.readyState === 1) {
          clearTimeout(timeout);
          resolve();
        } else {
          mongoose.connection.once('connected', () => {
            clearTimeout(timeout);
            resolve();
          });
          
          mongoose.connection.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      });
    }
    
    console.log('MongoDB: Connection ready, readyState:', mongoose.connection.readyState);
    return mongoose.connection;
  } catch (error) {
    console.error('ensureDBConnection error:', error);
    isConnected = false;
    throw error;
  }
}