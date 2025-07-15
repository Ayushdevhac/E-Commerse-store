import User from '../models/user.model.js';
import { client, ensureRedisConnection } from '../lib/redis.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();
const generateToken = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };      
}    
const storerefreshToken = async (userId, refreshToken) => {
    try {     
        const isConnected = await ensureRedisConnection();
        if (!isConnected) {
            console.warn('Redis not available, skipping refresh token storage');
            return;
        }
        
        await client.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
    }
    catch (error) {
        console.error('Error storing refresh token:', error);
    } 
}

const setcookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Allow cross-site cookies for Stripe redirects
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Allow cross-site cookies for Stripe redirects
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}
export const signup = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: 'Request body is missing' });
    }
    const { email, password, name } = req.body;
    
    try {
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
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }       
    const user = await User.findOne({ email });
    if (user &&(await user.comparePassword(password))) {
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
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const isConnected = await ensureRedisConnection();
      if (isConnected) {
        await client.del(`refresh_token:${decoded.userId}`);
      }
    }

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    }); 

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error.message);

    res.status(500).json({ message: 'Internal server error' });
  }
};


export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const userId = decoded.userId;
        
        const isConnected = await ensureRedisConnection();
        if (!isConnected) {
            return res.status(503).json({ message: 'Service temporarily unavailable' });
        }
        
        const storedRefreshToken = await client.get(`refresh_token:${userId}`);
        if (refreshToken !== storedRefreshToken) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
       const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
        
          res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'Strict', // Adjust as needed
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
        res.status(200).json({ message: 'Token refreshed successfully' });
    } catch (error) {
        console.error('Error refreshing token:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
} 

export const getprofile=async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({message: "server error", error:error.message});
    }
}



