import User from '../models/user.model.js';
import Order from '../models/order.model.js';
import bcrypt from 'bcryptjs';

export const getUserStats = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get order statistics
        const orderStats = await Order.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' }
                }
            }
        ]);
        
        // Get wishlist count
        const user = await User.findById(userId);
        const wishlistItems = user.wishlist ? user.wishlist.length : 0;
        
        const stats = {
            totalOrders: orderStats[0]?.totalOrders || 0,
            totalSpent: orderStats[0]?.totalSpent || 0,
            wishlistItems,
            memberSince: user.createdAt
        };
        
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching user stats:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, email, currentPassword, newPassword } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        // Check if email is already taken by another user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already taken' });
            }
        }
        
        // If user wants to change password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required' });
            }
            
            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            
            // Validate new password
            if (newPassword.length < 8) {
                return res.status(400).json({ message: 'New password must be at least 8 characters long' });
            }
            
            // Hash new password
            const saltRounds = 10;
            user.password = await bcrypt.hash(newPassword, saltRounds);
        }
        
        // Update other fields
        if (name && name.trim()) {
            user.name = name.trim();
        }
        
        if (email) {
            user.email = email;
        }
        
        await user.save();
        
        // Return updated user data (without password)
        const updatedUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };
        
        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user profile:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
