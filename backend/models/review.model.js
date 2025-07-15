import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  verified: {
    type: Boolean,
    default: true, // Reviews are verified since they're from actual purchases
  },
  helpful: {
    type: Number,
    default: 0,
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['active', 'hidden', 'flagged'],
    default: 'active',
  },
  images: [{
    type: String, // URLs to review images
  }],
  orderDate: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

// Compound index to ensure one review per user per product per order
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

// Additional indexes for performance
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });

// Virtual for checking if review is still editable (within 30 days)
reviewSchema.virtual('isEditable').get(function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.createdAt > thirtyDaysAgo;
});

// Virtual for time since review
reviewSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Method to check if user can mark review as helpful
reviewSchema.methods.canMarkHelpful = function(userId) {
  return !this.helpfulUsers.includes(userId) && !this.user.equals(userId);
};

// Static method to check if user can review a product
reviewSchema.statics.canUserReviewProduct = async function(userId, productId, orderId) {
  const Order = mongoose.model('Order');
  
  // Check if the order exists, belongs to the user, and contains the product
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    'products.product': productId,
    status: { $in: ['delivered', 'completed'] } // Allow reviews for both delivered and completed orders
  });

  if (!order) {
    return { canReview: false, reason: 'Order not found, not delivered, or not completed' };
  }

  // Check if order is within review time limit (90 days after delivery or completion)
  const reviewStartDate = order.deliveredAt || order.completedAt || order.createdAt;
  const reviewDeadline = new Date(reviewStartDate);
  reviewDeadline.setDate(reviewDeadline.getDate() + 90);
  
  if (new Date() > reviewDeadline) {
    return { canReview: false, reason: 'Review period has expired (90 days)' };
  }

  // Check if user has already reviewed this product for this order
  const existingReview = await this.findOne({
    user: userId,
    product: productId,
    order: orderId
  });

  if (existingReview) {
    return { canReview: false, reason: 'You have already reviewed this product for this order' };
  }

  return { canReview: true, order };
};

// Static method to get review statistics for a product
reviewSchema.statics.getProductReviewStats = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'active' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const result = stats[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  result.ratingDistribution.forEach(rating => {
    distribution[rating]++;
  });

  return {
    totalReviews: result.totalReviews,
    averageRating: Math.round(result.averageRating * 10) / 10,
    ratingDistribution: distribution
  };
};

const Review = mongoose.model("Review", reviewSchema);
export default Review;
