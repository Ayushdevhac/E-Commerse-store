import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		products: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				price: {
					type: Number,
					required: true,
					min: 0,
				},
			},		],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		shippingAddress: {
			type: {
				type: String,
				enum: ['home', 'work', 'other'],
				default: 'home'
			},
			street: {
				type: String,
				required: true,
				trim: true
			},
			city: {
				type: String,
				required: true,
				trim: true
			},
			state: {
				type: String,
				required: true,
				trim: true
			},
			zipCode: {
				type: String,
				required: true,
				trim: true
			},
			country: {
				type: String,
				required: true,
				trim: true,
				default: 'United States'
			}
		},		stripeSessionId: {
			type: String,
		},		status: {
			type: String,
			enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
			default: 'pending'
		},
		paymentStatus: {
			type: String,
			enum: ['pending', 'completed', 'failed', 'refunded'],
			default: 'pending'
		},
		shippedAt: {
			type: Date
		},		deliveredAt: {
			type: Date
		},
		completedAt: {
			type: Date
		},
		trackingNumber: {
			type: String
		},
		estimatedDelivery: {
			type: Date
		}
	},
	{ timestamps: true }
);

// Index for faster order status queries
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });

// Virtual for checking if order can be reviewed
orderSchema.virtual('canBeReviewed').get(function() {
	// Allow reviews for both delivered and completed orders
	if (this.status !== 'delivered' && this.status !== 'completed') return false;
	
	// Use deliveredAt if available, otherwise use completedAt, fallback to createdAt
	const reviewStartDate = this.deliveredAt || this.completedAt || this.createdAt;
	const reviewDeadline = new Date(reviewStartDate);
	reviewDeadline.setDate(reviewDeadline.getDate() + 90);
	
	return new Date() <= reviewDeadline;
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus) {
	const previousStatus = this.status;
	this.status = newStatus;
	
	if (newStatus === 'shipped' && !this.shippedAt) {
		this.shippedAt = new Date();
		// Set estimated delivery to 5-7 days from shipping
		this.estimatedDelivery = new Date();
		this.estimatedDelivery.setDate(this.estimatedDelivery.getDate() + 6);
	}
	
	if (newStatus === 'delivered' && !this.deliveredAt) {
		this.deliveredAt = new Date();
	}
	
	if (newStatus === 'completed' && !this.completedAt) {
		this.completedAt = new Date();
	}
	
	return this.save();
};

const Order = mongoose.model("Order", orderSchema);

export default Order;
