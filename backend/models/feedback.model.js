import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: false // Allow anonymous feedback
		},
		rating: {
			type: Number,
			min: -1,
			max: 5,
			required: true
		},
		type: {
			type: String,
			enum: ['bug', 'feature', 'improvement', 'general'],
			required: true
		},
		message: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1000
		},
		page: {
			type: String,
			required: true,
			trim: true
		},
		status: {
			type: String,
			enum: ['new', 'reviewed', 'in-progress', 'resolved', 'dismissed'],
			default: 'new'
		},
		adminNotes: {
			type: String,
			trim: true
		},
		userAgent: String,
		ipAddress: String
	},
	{ timestamps: true }
);

// Index for admin queries
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ type: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
