import Review from '../models/review.model.js';
import User from '../models/user.model.js';

export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ product: productId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user._id;

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ user: userId, product: productId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        const review = new Review({
            user: userId,
            product: productId,
            rating,
            comment
        });

        await review.save();
        
        // Populate user info for response
        await review.populate('user', 'name');

        res.status(201).json(review);
    } catch (error) {
        console.error('Error creating review:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id;

        const review = await Review.findOne({ _id: reviewId, user: userId });
        if (!review) {
            return res.status(404).json({ message: 'Review not found or unauthorized' });
        }

        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        
        await review.save();
        await review.populate('user', 'name');

        res.status(200).json(review);
    } catch (error) {
        console.error('Error updating review:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });
        if (!review) {
            return res.status(404).json({ message: 'Review not found or unauthorized' });
        }

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
