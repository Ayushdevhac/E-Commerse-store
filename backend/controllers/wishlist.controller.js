import User from '../models/user.model.js';

export const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');
        res.status(200).json(user.wishlist);
    } catch (error) {
        console.error('Error fetching wishlist:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user._id);

        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        user.wishlist.push(productId);
        await user.save();

        res.status(200).json({ message: 'Product added to wishlist' });
    } catch (error) {
        console.error('Error adding to wishlist:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(req.user._id);

        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await user.save();

        res.status(200).json({ message: 'Product removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user._id);

        const isInWishlist = user.wishlist.includes(productId);

        if (isInWishlist) {
            user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        } else {
            user.wishlist.push(productId);
        }

        await user.save();

        res.status(200).json({ 
            message: isInWishlist ? 'Product removed from wishlist' : 'Product added to wishlist',
            isInWishlist: !isInWishlist
        });
    } catch (error) {
        console.error('Error toggling wishlist:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
