import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { client } from "../lib/redis.js";

// Create a new review
export const createReview = async (req, res) => {
	try {
		const { productId, orderId, rating, comment, title, images = [] } = req.body;
		const userId = req.user._id;

		// Validate input
		if (!productId || !orderId || !rating || !comment || !title) {
			return res.status(400).json({
				message: "Product ID, Order ID, rating, comment, and title are required"
			});
		}

		if (rating < 1 || rating > 5) {
			return res.status(400).json({
				message: "Rating must be between 1 and 5"
			});
		}

		// Check if user can review this product
		const reviewCheck = await Review.canUserReviewProduct(userId, productId, orderId);
		
		if (!reviewCheck.canReview) {
			return res.status(403).json({
				message: reviewCheck.reason
			});
		}

		// Create the review
		const review = new Review({
			user: userId,
			product: productId,
			order: orderId,
			rating,
			comment,
			title,
			images: images.slice(0, 5), // Limit to 5 images
			orderDate: reviewCheck.order.createdAt
		});

		await review.save();

		// Update product average rating
		await updateProductRating(productId);

		// Clear cache for this product's reviews
		try {
			await client.del(`product_reviews:${productId}`);
			await client.del(`product_stats:${productId}`);
		} catch (redisError) {
			console.log("Redis cache clear failed, continuing...");
		}

		// Populate user data for response
		await review.populate('user', 'name');

		res.status(201).json({
			message: "Review created successfully",
			review
		});

	} catch (error) {
		console.error("Error creating review:", error);
		
		if (error.code === 11000) {
			return res.status(409).json({
				message: "You have already reviewed this product for this order"
			});
		}

		res.status(500).json({
			message: "Error creating review",
			error: error.message
		});
	}
};

// Get reviews for a product
export const getProductReviews = async (req, res) => {
	try {
		const { productId } = req.params;
		const { page = 1, limit = 10, sort = '-createdAt', rating } = req.query;

		// Try to get from cache first
		const cacheKey = `product_reviews:${productId}:${page}:${limit}:${sort}:${rating || 'all'}`;
		try {
			const cached = await client.get(cacheKey);
			if (cached) {
				return res.json(JSON.parse(cached));
			}
		} catch (redisError) {
			console.log("Redis cache read failed, fetching from database...");
		}

		// Build query
		const query = { product: productId, status: 'active' };
		if (rating) {
			query.rating = parseInt(rating);
		}

		// Get reviews with pagination
		const reviews = await Review.find(query)
			.populate('user', 'name')
			.sort(sort)
			.limit(limit * 1)
			.skip((page - 1) * limit)
			.lean();

		// Get total count
		const total = await Review.countDocuments(query);

		// Get review statistics
		const stats = await Review.getProductReviewStats(productId);

		const result = {
			reviews,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / limit),
				totalReviews: total,
				limit: parseInt(limit)
			},
			stats
		};

		// Cache for 5 minutes
		try {
			await client.setEx(cacheKey, 300, JSON.stringify(result));
		} catch (redisError) {
			console.log("Redis cache write failed, continuing...");
		}

		res.json(result);

	} catch (error) {
		console.error("Error fetching reviews:", error);
		res.status(500).json({
			message: "Error fetching reviews",
			error: error.message
		});
	}
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
	try {
		const userId = req.user._id;
		const { page = 1, limit = 10 } = req.query;

		const reviews = await Review.find({ user: userId })
			.populate('product', 'name images price')
			.populate('order', 'createdAt totalAmount')
			.sort('-createdAt')
			.limit(limit * 1)
			.skip((page - 1) * limit);

		const total = await Review.countDocuments({ user: userId });

		res.json({
			reviews,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / limit),
				totalReviews: total,
				limit: parseInt(limit)
			}
		});

	} catch (error) {
		console.error("Error fetching user reviews:", error);
		res.status(500).json({
			message: "Error fetching user reviews",
			error: error.message
		});
	}
};

// Update a review (only within edit period)
export const updateReview = async (req, res) => {
	try {
		const { reviewId } = req.params;
		const { rating, comment, title, images } = req.body;
		const userId = req.user._id;

		const review = await Review.findOne({ _id: reviewId, user: userId });

		if (!review) {
			return res.status(404).json({
				message: "Review not found"
			});
		}

		if (!review.isEditable) {
			return res.status(403).json({
				message: "Review can no longer be edited (30-day limit exceeded)"
			});
		}

		// Update fields if provided
		if (rating !== undefined) review.rating = rating;
		if (comment !== undefined) review.comment = comment;
		if (title !== undefined) review.title = title;
		if (images !== undefined) review.images = images.slice(0, 5);

		await review.save();

		// Update product rating
		await updateProductRating(review.product);

		// Clear cache
		try {
			await client.del(`product_reviews:${review.product}`);
			await client.del(`product_stats:${review.product}`);
		} catch (redisError) {
			console.log("Redis cache clear failed, continuing...");
		}

		res.json({
			message: "Review updated successfully",
			review
		});

	} catch (error) {
		console.error("Error updating review:", error);
		res.status(500).json({
			message: "Error updating review",
			error: error.message
		});
	}
};

// Delete a review
export const deleteReview = async (req, res) => {
	try {
		const { reviewId } = req.params;
		const userId = req.user._id;

		const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });

		if (!review) {
			return res.status(404).json({
				message: "Review not found"
			});
		}

		// Update product rating
		await updateProductRating(review.product);

		// Clear cache
		try {
			await client.del(`product_reviews:${review.product}`);
			await client.del(`product_stats:${review.product}`);
		} catch (redisError) {
			console.log("Redis cache clear failed, continuing...");
		}

		res.json({
			message: "Review deleted successfully"
		});

	} catch (error) {
		console.error("Error deleting review:", error);
		res.status(500).json({
			message: "Error deleting review",
			error: error.message
		});
	}
};

// Mark review as helpful
export const markReviewHelpful = async (req, res) => {
	try {
		const { reviewId } = req.params;
		const userId = req.user._id;

		const review = await Review.findById(reviewId);

		if (!review) {
			return res.status(404).json({
				message: "Review not found"
			});
		}

		if (!review.canMarkHelpful(userId)) {
			return res.status(400).json({
				message: "You cannot mark this review as helpful"
			});
		}

		review.helpfulUsers.push(userId);
		review.helpful += 1;
		await review.save();

		res.json({
			message: "Review marked as helpful",
			helpful: review.helpful
		});

	} catch (error) {
		console.error("Error marking review as helpful:", error);
		res.status(500).json({
			message: "Error marking review as helpful",
			error: error.message
		});
	}
};

// Get reviewable products for a user
export const getReviewableProducts = async (req, res) => {
	try {
		const userId = req.user._id;

		// Get delivered and completed orders within review period (90 days)
		const ninetyDaysAgo = new Date();
		ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

		const orders = await Order.find({
			user: userId,
			status: { $in: ['delivered', 'completed'] }, // Include both delivered and completed orders
			$or: [
				{ deliveredAt: { $gte: ninetyDaysAgo } },
				{ completedAt: { $gte: ninetyDaysAgo } },
				{ 
					deliveredAt: { $exists: false },
					completedAt: { $exists: false },
					createdAt: { $gte: ninetyDaysAgo }
				}
			]
		}).populate('products.product', 'name images price');

		// Get existing reviews for this user
		const existingReviews = await Review.find({ user: userId });
		const reviewedProducts = new Set(
			existingReviews.map(r => `${r.product}_${r.order}`)
		);

		// Filter products that can be reviewed
		const reviewableProducts = [];
		
		for (const order of orders) {
			for (const item of order.products) {
				const key = `${item.product._id}_${order._id}`;
				if (!reviewedProducts.has(key)) {					reviewableProducts.push({
						product: item.product,
						order: {
							_id: order._id,
							status: order.status,
							createdAt: order.createdAt,
							deliveredAt: order.deliveredAt,
							completedAt: order.completedAt,
							totalAmount: order.totalAmount
						},
						quantity: item.quantity,
						price: item.price
					});
				}
			}
		}

		res.json({
			reviewableProducts,
			total: reviewableProducts.length
		});

	} catch (error) {
		console.error("Error fetching reviewable products:", error);
		res.status(500).json({
			message: "Error fetching reviewable products",
			error: error.message
		});
	}
};

// Helper function to update product rating
const updateProductRating = async (productId) => {
	try {
		const stats = await Review.getProductReviewStats(productId);
		
		await Product.findByIdAndUpdate(productId, {
			averageRating: stats.averageRating,
			totalReviews: stats.totalReviews
		});
		
	} catch (error) {
		console.error("Error updating product rating:", error);
	}
};
