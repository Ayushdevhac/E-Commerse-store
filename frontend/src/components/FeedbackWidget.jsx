import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import axios from '../lib/axios';
import showToast from '../lib/toast';

const FeedbackWidget = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [step, setStep] = useState('rating'); // rating, details, success
	const [feedback, setFeedback] = useState({
		rating: 0,
		type: '',
		message: '',
		page: window.location.pathname
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const feedbackTypes = [
		{ id: 'bug', label: 'Bug Report', icon: '🐛' },
		{ id: 'feature', label: 'Feature Request', icon: '💡' },
		{ id: 'improvement', label: 'Improvement', icon: '🚀' },
		{ id: 'general', label: 'General Feedback', icon: '💬' }
	];

	const handleRatingChange = (rating) => {
		setFeedback(prev => ({ ...prev, rating }));
		setStep('details');
	};

	const handleSubmit = async () => {
		if (!feedback.type || !feedback.message.trim()) {
			showToast.error('Please select a feedback type and provide details');
			return;
		}

		setIsSubmitting(true);
		try {
			await axios.post('/feedback', feedback);
			setStep('success');
			showToast.success('Thank you for your feedback!');
		} catch (error) {
			showToast.error('Failed to submit feedback. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetWidget = () => {
		setIsOpen(false);
		setStep('rating');
		setFeedback({ rating: 0, type: '', message: '', page: window.location.pathname });
	};

	return (
		<>
			{/* Feedback Button */}
			<motion.button
				onClick={() => setIsOpen(true)}
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.95 }}
				className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg z-40 transition-colors duration-200"
			>
				<MessageSquare className="w-6 h-6" />
			</motion.button>

			{/* Feedback Modal */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
						onClick={(e) => e.target === e.currentTarget && resetWidget()}
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.8, opacity: 0 }}
							className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700"
						>
							{/* Header */}
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-bold text-white">
									{step === 'success' ? 'Thank You!' : 'Share Your Feedback'}
								</h2>
								<button
									onClick={resetWidget}
									className="text-gray-400 hover:text-gray-300"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							{/* Rating Step */}
							{step === 'rating' && (
								<div className="text-center">
									<p className="text-gray-300 mb-6">How would you rate your experience?</p>
									<div className="flex justify-center space-x-2 mb-6">
										{[1, 2, 3, 4, 5].map((rating) => (
											<button
												key={rating}
												onClick={() => handleRatingChange(rating)}
												className="p-2 hover:scale-110 transition-transform duration-200"
											>
												<Star
													className={`w-8 h-8 ${
														rating <= feedback.rating
															? 'text-yellow-400 fill-current'
															: 'text-gray-500'
													}`}
												/>
											</button>
										))}
									</div>
									<div className="flex justify-center space-x-4">
										<button
											onClick={() => handleRatingChange(-1)}
											className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
										>
											<ThumbsDown className="w-4 h-4" />
											<span>Poor</span>
										</button>
										<button
											onClick={() => handleRatingChange(1)}
											className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
										>
											<ThumbsUp className="w-4 h-4" />
											<span>Great</span>
										</button>
									</div>
								</div>
							)}

							{/* Details Step */}
							{step === 'details' && (
								<div className="space-y-4">
									<div>
										<label className="block text-gray-300 mb-2">What type of feedback is this?</label>
										<div className="grid grid-cols-2 gap-2">
											{feedbackTypes.map((type) => (
												<button
													key={type.id}
													onClick={() => setFeedback(prev => ({ ...prev, type: type.id }))}
													className={`p-3 rounded-lg border transition-colors text-left ${
														feedback.type === type.id
															? 'border-emerald-500 bg-emerald-600/20'
															: 'border-gray-600 hover:border-gray-500'
													}`}
												>
													<div className="flex items-center space-x-2">
														<span>{type.icon}</span>
														<span className="text-sm text-gray-300">{type.label}</span>
													</div>
												</button>
											))}
										</div>
									</div>

									<div>
										<label className="block text-gray-300 mb-2">Tell us more</label>
										<textarea
											value={feedback.message}
											onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
											placeholder="Please describe your feedback in detail..."
											className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
											rows={4}
										/>
									</div>

									<div className="flex space-x-3">
										<button
											onClick={() => setStep('rating')}
											className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
										>
											Back
										</button>
										<button
											onClick={handleSubmit}
											disabled={isSubmitting}
											className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
										>
											{isSubmitting ? (
												<motion.div
													animate={{ rotate: 360 }}
													transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
													className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
												/>
											) : (
												<>
													<Send className="w-4 h-4 mr-2" />
													Submit
												</>
											)}
										</button>
									</div>
								</div>
							)}

							{/* Success Step */}
							{step === 'success' && (
								<div className="text-center">
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{ delay: 0.2, type: "spring" }}
										className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
									>
										<ThumbsUp className="w-8 h-8 text-white" />
									</motion.div>
									<p className="text-gray-300 mb-6">
										Your feedback has been submitted successfully. We appreciate your input!
									</p>
									<button
										onClick={resetWidget}
										className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
									>
										Close
									</button>
								</div>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export default FeedbackWidget;
