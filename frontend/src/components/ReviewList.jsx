import { useState, useEffect } from "react";
import { Star, ThumbsUp, MoreVertical, Edit, Trash } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "../lib/axios";

const ReviewList = ({ productId, userReviews = false, onReviewUpdate }) => {
	const [reviews, setReviews] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState(null);
	const [ratingFilter, setRatingFilter] = useState("");
	const [sortBy, setSortBy] = useState("-createdAt");

	useEffect(() => {
		fetchReviews();
	}, [productId, currentPage, ratingFilter, sortBy]);

	const fetchReviews = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: currentPage,
				limit: 10,
				sort: sortBy
			});
			
			if (ratingFilter) {
				params.append('rating', ratingFilter);
			}

			const url = userReviews				? `/reviews/my-reviews?${params}`
				: `/reviews/product/${productId}?${params}`;
			
			const response = await axios.get(url);
			
			setReviews(response.data.reviews);
			setPagination(response.data.pagination);
			
			if (response.data.stats) {
				setStats(response.data.stats);
			}
			
		} catch (error) {
			console.error("Error fetching reviews:", error);
			toast.error("Failed to load reviews");
		} finally {
			setLoading(false);
		}
	};

	const handleMarkHelpful = async (reviewId) => {
		try {
			const response = await axios.post(`/reviews/${reviewId}/helpful`);
			
			setReviews(prev => prev.map(review => 
				review._id === reviewId 
					? { ...review, helpful: response.data.helpful }
					: review
			));
			
			toast.success("Marked as helpful!");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to mark as helpful");
		}
	};

	const handleDeleteReview = async (reviewId) => {
		if (!window.confirm("Are you sure you want to delete this review?")) {
			return;
		}

		try {
			await axios.delete(`/reviews/${reviewId}`);
			setReviews(prev => prev.filter(review => review._id !== reviewId));
			toast.success("Review deleted successfully");
			if (onReviewUpdate) onReviewUpdate();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to delete review");
		}
	};

	const renderStars = (rating) => {
		return (
			<div className="flex items-center">
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						size={16}
						className={`${
							star <= rating ? "text-yellow-400 fill-current" : "text-gray-600"
						}`}
					/>
				))}
			</div>
		);
	};

	const renderRatingDistribution = () => {
		if (!stats) return null;

		return (
			<div className="bg-gray-800 p-4 rounded-lg mb-6">
				<div className="flex items-center justify-between mb-4">
					<div>
						<div className="flex items-center space-x-2">
							<span className="text-3xl font-bold text-white">
								{stats.averageRating}
							</span>
							{renderStars(Math.round(stats.averageRating))}
						</div>
						<p className="text-gray-400 text-sm">
							Based on {stats.totalReviews} reviews
						</p>
					</div>
				</div>

				<div className="space-y-2">
					{[5, 4, 3, 2, 1].map((rating) => (
						<div key={rating} className="flex items-center space-x-2">
							<span className="text-sm text-gray-400 w-8">{rating}</span>
							<Star size={14} className="text-yellow-400 fill-current" />
							<div className="flex-1 bg-gray-700 rounded-full h-2">
								<div
									className="bg-emerald-500 h-2 rounded-full"
									style={{
										width: `${
											stats.totalReviews > 0
												? (stats.ratingDistribution[rating] / stats.totalReviews) * 100
												: 0
										}%`,
									}}
								/>
							</div>
							<span className="text-sm text-gray-400 w-8">
								{stats.ratingDistribution[rating]}
							</span>
						</div>
					))}
				</div>
			</div>
		);
	};

	if (loading) {
		return (
			<div className="flex justify-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
			</div>
		);
	}

	return (
		<div>
			{!userReviews && renderRatingDistribution()}

			{/* Filters */}
			<div className="flex flex-wrap gap-4 mb-6">
				<select
					value={ratingFilter}
					onChange={(e) => setRatingFilter(e.target.value)}
					className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
				>
					<option value="">All Ratings</option>
					<option value="5">5 Stars</option>
					<option value="4">4 Stars</option>
					<option value="3">3 Stars</option>
					<option value="2">2 Stars</option>
					<option value="1">1 Star</option>
				</select>

				<select
					value={sortBy}
					onChange={(e) => setSortBy(e.target.value)}
					className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
				>
					<option value="-createdAt">Newest First</option>
					<option value="createdAt">Oldest First</option>
					<option value="-rating">Highest Rating</option>
					<option value="rating">Lowest Rating</option>
					<option value="-helpful">Most Helpful</option>
				</select>
			</div>

			{/* Reviews List */}
			{reviews.length === 0 ? (
				<div className="text-center py-8 text-gray-400">
					{userReviews ? "You haven't written any reviews yet." : "No reviews yet. Be the first to review!"}
				</div>
			) : (
				<div className="space-y-6">
					{reviews.map((review) => (
						<div key={review._id} className="bg-gray-800 p-6 rounded-lg">
							<div className="flex items-start justify-between mb-3">
								<div className="flex items-center space-x-3">
									<div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
										<span className="text-white font-medium">
											{review.user?.name?.charAt(0) || "U"}
										</span>
									</div>
									<div>
										<p className="font-medium text-white">
											{review.user?.name || "Anonymous"}
										</p>
										<div className="flex items-center space-x-2">
											{renderStars(review.rating)}
											{review.verified && (
												<span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">
													Verified Purchase
												</span>
											)}
										</div>
									</div>
								</div>
								
								{userReviews && (
									<div className="relative">
										<button className="text-gray-400 hover:text-white">
											<MoreVertical size={20} />
										</button>
										{/* Dropdown menu would go here */}
									</div>
								)}
							</div>

							<h4 className="font-medium text-white mb-2">{review.title}</h4>
							<p className="text-gray-300 mb-4">{review.comment}</p>

							{review.images && review.images.length > 0 && (
								<div className="flex space-x-2 mb-4">
									{review.images.map((image, index) => (
										<img
											key={index}
											src={image}
											alt={`Review ${index + 1}`}
											className="w-16 h-16 object-cover rounded-lg"
										/>
									))}
								</div>
							)}

							<div className="flex items-center justify-between text-sm text-gray-400">
								<span>
									{new Date(review.createdAt).toLocaleDateString()}
								</span>
								
								{!userReviews && (
									<button
										onClick={() => handleMarkHelpful(review._id)}
										className="flex items-center space-x-1 hover:text-emerald-400 transition-colors"
									>
										<ThumbsUp size={14} />
										<span>Helpful ({review.helpful || 0})</span>
									</button>
								)}

								{userReviews && (
									<div className="flex items-center space-x-2">
										{review.isEditable && (
											<button className="text-emerald-400 hover:text-emerald-300">
												<Edit size={14} />
											</button>
										)}
										<button 
											onClick={() => handleDeleteReview(review._id)}
											className="text-red-400 hover:text-red-300"
										>
											<Trash size={14} />
										</button>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && (
				<div className="flex justify-center mt-8">
					<div className="flex items-center space-x-2">
						<button
							onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
							className="px-3 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						
						<span className="px-3 py-2 text-gray-300">
							Page {currentPage} of {pagination.totalPages}
						</span>
						
						<button
							onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
							disabled={currentPage === pagination.totalPages}
							className="px-3 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ReviewList;
