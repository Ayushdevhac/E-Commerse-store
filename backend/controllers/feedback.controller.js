import Feedback from '../models/feedback.model.js';
import { body, validationResult } from 'express-validator';

// Validation rules for feedback
export const validateFeedback = [
	body('rating')
		.isInt({ min: -1, max: 5 })
		.withMessage('Rating must be between -1 and 5'),
	body('type')
		.isIn(['bug', 'feature', 'improvement', 'general'])
		.withMessage('Invalid feedback type'),
	body('message')
		.trim()
		.isLength({ min: 5, max: 1000 })
		.withMessage('Message must be between 5 and 1000 characters'),
	body('page')
		.trim()
		.isLength({ min: 1, max: 200 })
		.withMessage('Page path is required')
];

// Submit feedback
export const submitFeedback = async (req, res) => {
	try {
		// Check for validation errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				message: 'Validation error',
				errors: errors.array()
			});
		}

		const { rating, type, message, page } = req.body;

		const feedback = new Feedback({
			user: req.user?._id || null, // Optional user (for anonymous feedback)
			rating,
			type,
			message,
			page,
			userAgent: req.get('User-Agent'),
			ipAddress: req.ip
		});

		await feedback.save();

		// Populate user data if available
		if (feedback.user) {
			await feedback.populate('user', 'name email');
		}

		res.status(201).json({
			message: 'Feedback submitted successfully',
			feedback: {
				_id: feedback._id,
				rating: feedback.rating,
				type: feedback.type,
				message: feedback.message,
				page: feedback.page,
				createdAt: feedback.createdAt
			}
		});

	} catch (error) {
		console.error('Error submitting feedback:', error);
		res.status(500).json({
			message: 'Failed to submit feedback'
		});
	}
};

// Get all feedback (admin only)
export const getAllFeedback = async (req, res) => {
	try {
		const { status, type, page = 1, limit = 20 } = req.query;

		const filter = {};
		if (status) filter.status = status;
		if (type) filter.type = type;

		const pageNum = parseInt(page);
		const limitNum = parseInt(limit);
		const skip = (pageNum - 1) * limitNum;

		const feedback = await Feedback.find(filter)
			.populate('user', 'name email')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limitNum);

		const total = await Feedback.countDocuments(filter);

		res.json({
			feedback,
			pagination: {
				currentPage: pageNum,
				totalPages: Math.ceil(total / limitNum),
				totalFeedback: total,
				limit: limitNum
			}
		});

	} catch (error) {
		console.error('Error fetching feedback:', error);
		res.status(500).json({
			message: 'Failed to fetch feedback'
		});
	}
};

// Update feedback status (admin only)
export const updateFeedbackStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, adminNotes } = req.body;

		if (!['new', 'reviewed', 'in-progress', 'resolved', 'dismissed'].includes(status)) {
			return res.status(400).json({
				message: 'Invalid status'
			});
		}

		const feedback = await Feedback.findByIdAndUpdate(
			id,
			{ 
				status,
				...(adminNotes && { adminNotes })
			},
			{ new: true }
		).populate('user', 'name email');

		if (!feedback) {
			return res.status(404).json({
				message: 'Feedback not found'
			});
		}

		res.json({
			message: 'Feedback status updated',
			feedback
		});

	} catch (error) {
		console.error('Error updating feedback:', error);
		res.status(500).json({
			message: 'Failed to update feedback'
		});
	}
};

// Get feedback statistics (admin only)
export const getFeedbackStats = async (req, res) => {
	try {
		const stats = await Feedback.aggregate([
			{
				$group: {
					_id: null,
					totalFeedback: { $sum: 1 },
					averageRating: { $avg: '$rating' },
					byType: {
						$push: {
							type: '$type',
							rating: '$rating'
						}
					},
					byStatus: {
						$push: '$status'
					}
				}
			},
			{
				$project: {
					_id: 0,
					totalFeedback: 1,
					averageRating: { $round: ['$averageRating', 2] },
					typeStats: {
						$reduce: {
							input: '$byType',
							initialValue: {},
							in: {
								$mergeObjects: [
									'$$value',
									{
										$arrayToObject: [[{
											k: '$$this.type',
											v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.type', input: '$$value' } }, 0] }, 1] }
										}]]
									}
								]
							}
						}
					},
					statusStats: {
						$reduce: {
							input: '$byStatus',
							initialValue: {},
							in: {
								$mergeObjects: [
									'$$value',
									{
										$arrayToObject: [[{
											k: '$$this',
											v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] }
										}]]
									}
								]
							}
						}
					}
				}
			}
		]);

		res.json(stats[0] || {
			totalFeedback: 0,
			averageRating: 0,
			typeStats: {},
			statusStats: {}
		});

	} catch (error) {
		console.error('Error fetching feedback stats:', error);
		res.status(500).json({
			message: 'Failed to fetch feedback statistics'
		});
	}
};
