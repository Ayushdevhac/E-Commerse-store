import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import couponRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import wishlistRoutes from './routes/wishlist.route.js';
import reviewRoutes from './routes/review.route.js';
import vipRoutes from './routes/vip.route.js';
import cookieParser from 'cookie-parser';
import {connectDB }from './lib/db.js';
import { connectRedis, disconnectRedis } from './lib/redis.js';
dotenv.config();
const app = express();
const PORT=process.env.PORT ||5000;

// CORS configuration
app.use(cors({
    origin: 'http://localhost:5174', // Frontend URL
    credentials: true
}));

app.use(express.json({limit: '10mb'}));
app.use(cookieParser());
app.use("/api/auth",authRoutes) ;
app.use("/api/products",productRoutes) ;
app.use("/api/cart",cartRoutes) ;
app.use("/api/coupon",couponRoutes) ;
app.use("/api/payments",paymentRoutes) ;
app.use("/api/analytics",analyticsRoutes) ;
app.use("/api/wishlist",wishlistRoutes) ;
app.use("/api/reviews",reviewRoutes) ;
app.use("/api/vip", vipRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        message: "Server is running successfully",
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log('Server is running on http://localhost:'+PORT);
    connectDB();
    connectRedis();
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    await disconnectRedis();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down server...');
    await disconnectRedis();
    process.exit(0);
});

