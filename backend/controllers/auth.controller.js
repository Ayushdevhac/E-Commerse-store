import User from '../models/user.model.js';
import { client, ensureRedisConnection } from '../lib/redis.js';
import { ensureDBConnection } from '../lib/db.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();
const generateToken = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };      
}    
const storerefreshToken = async (userId, refreshToken) => {
    try {
        console.log('🔄 Storing refresh token for user:', userId);
        
        const isConnected = await ensureRedisConnection();
        if (!isConnected) {
            console.warn('❌ Redis not available, skipping refresh token storage');
            throw new Error('Redis connection not available');
        }
        
        const result = await client.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
        console.log('✅ Refresh token stored successfully for user:', userId, 'Result:', result);
        
        // Verify the token was actually stored
        const stored = await client.get(`refresh_token:${userId}`);
        if (stored) {
            console.log('✅ Token verification successful');
        } else {
            console.error('❌ Token verification failed - not found in Redis');
        }
    }
    catch (error) {
        console.error('❌ Error storing refresh token:', error.message);
        throw error;
    } 
}

const setcookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Base cookie options
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'None' : 'Lax',
        path: '/', // Ensure cookies are available site-wide
    };
    
    // Access token cookie (15 minutes)
    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    // Refresh token cookie (7 days)
    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    console.log('🍪 Cookies set:', {
        accessTokenExpiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isProduction,
        secure: isProduction,
        sameSite: isProduction ? 'None' : 'Lax'
    });
}
export const signup = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: 'Request body is missing' });
    }
    const { email, password, name } = req.body;
    
    try {
        // Ensure database connection before any DB operations
        await ensureDBConnection();
        
        const userExits = await User.findOne({ email });
        if (userExits) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await User.create({ email, password, name });
        // authenticate
        const { accessToken, refreshToken } = generateToken(user._id);
        await storerefreshToken(user._id, refreshToken);
        setcookies(res, accessToken, refreshToken);
        res.status(201).json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.errors) {
            console.error('Validation errors:', error.errors);
        }
        res.status(500).json({ message: error.message });
    }
};
export const login = async (req,res) => {
   try {
    // Ensure database connection before any DB operations
    await ensureDBConnection();
    
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }       
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    const passwordMatch = await user.comparePassword(password);
    
    if (passwordMatch) {
        const { accessToken, refreshToken } = generateToken(user._id);
        await storerefreshToken(user._id, refreshToken);   
        setcookies(res, accessToken, refreshToken);
        return res.status(200).json({
            message: 'Login successful',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    }
    else {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
   } catch (error) {
    console.error('Login error:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
    }
    if (error.name === 'MongoError' && error.code === 11000) {
        return res.status(400).json({ message: 'Email already exists' });
    }
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
    
   }
};

export const logout = async (req, res) => {
  try {
    console.log('🚪 Logout process started');
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        console.log('🔍 Decoded token for user:', decoded.userId);
        
        const isConnected = await ensureRedisConnection();
        if (isConnected) {
          const result = await client.del(`refresh_token:${decoded.userId}`);
          console.log('🗑️ Refresh token removed from Redis:', result);
        } else {
          console.warn('⚠️ Redis not available during logout');
        }
      } catch (tokenError) {
        console.warn('⚠️ Token verification failed during logout (expired/invalid):', tokenError.message);
        // Continue with logout even if token is invalid
      }
    } else {
      console.log('ℹ️ No refresh token found during logout');
    }

    // Enhanced cookie clearing with proper options
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      path: '/', // Ensure we clear cookies from the same path they were set
    };

    res.clearCookie('accessToken', cookieOptions); 
    res.clearCookie('refreshToken', cookieOptions);
    
    console.log('✅ Logout completed successfully');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            console.warn('Refresh token request without token cookie');
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        console.log('🔄 Processing refresh token request for user...');

        // Verify the refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            console.log('✅ Refresh token JWT verification successful for user:', decoded.userId);
        } catch (jwtError) {
            console.error('❌ JWT verification failed:', jwtError.message);
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }
        
        const userId = decoded.userId;
        
        // Check if Redis is available
        const isConnected = await ensureRedisConnection();
        if (!isConnected) {
            console.warn('⚠️ Redis unavailable, skipping token validation for development');
            // In development, we'll allow refresh without Redis validation
            // In production, you might want to reject the request instead
        } else {
            // Validate the refresh token against stored token
            try {
                const storedRefreshToken = await client.get(`refresh_token:${userId}`);
                if (!storedRefreshToken) {
                    console.error('❌ No refresh token found in Redis for user:', userId);
                    console.log('💡 User may need to log in again to store refresh token');
                    return res.status(403).json({ 
                        message: 'Refresh token not found - please log in again',
                        code: 'TOKEN_NOT_STORED'
                    });
                }
                
                if (refreshToken !== storedRefreshToken) {
                    console.error('❌ Refresh token mismatch for user:', userId);
                    console.log('🔍 Request token preview:', refreshToken.substring(0, 20) + '...');
                    console.log('🔍 Stored token preview:', storedRefreshToken.substring(0, 20) + '...');
                    return res.status(403).json({ 
                        message: 'Refresh token mismatch - please log in again',
                        code: 'TOKEN_MISMATCH'
                    });
                }
                console.log('✅ Redis token validation successful');
            } catch (redisError) {
                console.error('❌ Redis validation error:', redisError.message);
                // Continue without Redis validation in development
                console.warn('⚠️ Continuing without Redis validation due to error');
            }
        }        // Verify user still exists and is active
        const user = await User.findById(userId);
        if (!user) {
            console.error('❌ User not found for refresh token:', userId);
            return res.status(403).json({ message: 'User not found' });
        }
        console.log('✅ User verified:', user.name);

        // Generate new access token AND new refresh token for security
        const { accessToken, refreshToken: newRefreshToken } = generateToken(userId);
        console.log('✅ New access and refresh tokens generated for user:', user.name);
        
        // Store the new refresh token in Redis
        await storerefreshToken(userId, newRefreshToken);
        
        // Set both new tokens as cookies
        setcookies(res, accessToken, newRefreshToken);

        console.log('🎉 Token refresh completed successfully for user:', user.name);
        res.status(200).json({ 
            message: 'Token refreshed successfully',
            expiresIn: 15 * 60 // 15 minutes in seconds
        });
    } catch (error) {
        console.error('Error refreshing token:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getprofile=async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({message: "server error", error:error.message});
    }
}



