import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';    
import User from '../models/user.model.js';
dotenv.config();
export const protectRoute =async (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }
    try {   
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user= await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "user not found" });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(403).json({ message: 'Forbidden access' });
    }
}

export const adminRoute = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Admins only.' });
};