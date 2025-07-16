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
        
        console.log('Profile update request:', { 
            userId: userId.toString(), 
            name, 
            email, 
            hasCurrentPassword: !!currentPassword, 
            hasNewPassword: !!newPassword 
        });
        
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({ message: 'User not found' });
        }
          // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            console.log('Invalid email format:', email);
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        // Check if email is already taken by another user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                console.log('Email already taken:', email);
                return res.status(400).json({ message: 'Email is already taken' });
            }        }          // If user wants to change password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required' });
            }
            
            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            // Get dynamic password requirements from security settings
            let minLength = 8; // Default value
            let validationPassed = false;
            
            try {
                const adminController = await import('../controllers/admin.controller.js');
                minLength = adminController.securitySettings?.passwordMinLength || 8;
                
                // Validate new password strength
                if (newPassword.length < minLength) {
                    return res.status(400).json({ 
                        message: `New password must be at least ${minLength} characters long` 
                    });
                }
                
                // Check password strength criteria
                const criteria = [
                    newPassword.length >= minLength,
                    /[A-Z]/.test(newPassword),
                    /[a-z]/.test(newPassword),
                    /\d/.test(newPassword),
                    /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                ];
                const strength = criteria.filter(Boolean).length;
                
                if (strength < 3) {
                    return res.status(400).json({ 
                        message: 'Password is too weak. Must contain at least 3 of: uppercase, lowercase, number, special character' 
                    });
                }
                
                validationPassed = true;
                
            } catch (importError) {
                console.error('Error accessing security settings:', importError);
                // Use default validation if import fails
                minLength = 8;
                
                if (newPassword.length < minLength) {
                    return res.status(400).json({ 
                        message: `New password must be at least ${minLength} characters long` 
                    });
                }
                
                // Check password strength criteria with default settings
                const criteria = [
                    newPassword.length >= minLength,
                    /[A-Z]/.test(newPassword),
                    /[a-z]/.test(newPassword),
                    /\d/.test(newPassword),
                    /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                ];
                const strength = criteria.filter(Boolean).length;
                
                if (strength < 3) {
                    return res.status(400).json({ 
                        message: 'Password is too weak. Must contain at least 3 of: uppercase, lowercase, number, special character' 
                    });
                }
                
                validationPassed = true;
            }              // Hash new password after validation passes
            if (validationPassed) {
                const saltRounds = 10; // Use same salt rounds as pre-save hook
                const oldPasswordHash = user.password;
                user.password = await bcrypt.hash(newPassword, saltRounds);
                
                // Test the new hash immediately
                const testNewPassword = await bcrypt.compare(newPassword, user.password);
                
                // Mark password as modified but already hashed to prevent double hashing in pre-save hook
                user.markModified('password');
                user._isPasswordAlreadyHashed = true;
            }
        }
        // Update other fields
        if (name && name.trim()) {
            user.name = name.trim();
        }
        
        if (email) {
            console.log('Updating email from', user.email, 'to', email);
            user.email = email;
        }
        
        console.log('Saving user profile...');
        await user.save();
        
        console.log('Profile updated successfully');
        
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
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
};
