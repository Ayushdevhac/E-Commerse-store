import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
		},		discountPercentage: {
			type: Number,
			required: true,
			min: 0,
			max: 60,
		},
		minimumAmount: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		expirationDate: {
			type: Date,
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

// Create compound unique index to prevent duplicate coupon codes for the same user
couponSchema.index({ userId: 1, code: 1 }, { unique: true });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
