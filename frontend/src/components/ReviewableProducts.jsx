import { useState, useEffect } from "react";
import { Star, Calendar, Package } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "../lib/axios";
import ReviewForm from "./ReviewForm";

const ReviewableProducts = () => {
	const [reviewableProducts, setReviewableProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [showReviewForm, setShowReviewForm] = useState(false);

	useEffect(() => {
		fetchReviewableProducts();
	}, []);

	const fetchReviewableProducts = async () => {
		try {
			setLoading(true);
			const response = await axios.get("/reviews/reviewable-products");
			setReviewableProducts(response.data.reviewableProducts);
		} catch (error) {
			console.error("Error fetching reviewable products:", error);
			toast.error("Failed to load reviewable products");
		} finally {
			setLoading(false);
		}
	};

	const handleStartReview = (productItem) => {
		setSelectedProduct(productItem);
		setShowReviewForm(true);
	};

	const handleReviewSubmitted = (review) => {
		// Remove the product from reviewable list
		setReviewableProducts(prev => 
			prev.filter(item => 
				!(item.product._id === selectedProduct.product._id && 
				  item.order._id === selectedProduct.order._id)
			)
		);
		setShowReviewForm(false);
		setSelectedProduct(null);
		toast.success("Thank you for your review!");
	};

	const handleCancelReview = () => {
		setShowReviewForm(false);
		setSelectedProduct(null);
	};
	const getDaysRemaining = (orderDate, deliveredAt, completedAt) => {
		// Use deliveredAt if available, otherwise use completedAt, fallback to orderDate
		const reviewStartDate = deliveredAt || completedAt || orderDate;
		const reviewDeadline = new Date(reviewStartDate);
		reviewDeadline.setDate(reviewDeadline.getDate() + 90);
		
		const today = new Date();
		const diffTime = reviewDeadline - today;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		return Math.max(0, diffDays);
	};

	if (loading) {
		return (
			<div className="flex justify-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
			</div>
		);
	}

	if (showReviewForm && selectedProduct) {
		return (
			<div className="max-w-2xl mx-auto">
				<ReviewForm
					product={selectedProduct.product}
					order={selectedProduct.order}
					onSubmit={handleReviewSubmitted}
					onCancel={handleCancelReview}
				/>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-white mb-2">
					Products You Can Review
				</h2>
				<p className="text-gray-400">
					Share your experience with products you've purchased. Reviews help other customers make informed decisions.
				</p>
			</div>

			{reviewableProducts.length === 0 ? (
				<div className="text-center py-12">
					<Package size={48} className="mx-auto text-gray-500 mb-4" />
					<h3 className="text-xl font-medium text-gray-300 mb-2">
						No products to review
					</h3>					<p className="text-gray-400">
						You can review products for up to 90 days after delivery or completion.
					</p>
				</div>
			) : (
				<div className="space-y-4">					{reviewableProducts.map((item) => {
						const daysRemaining = getDaysRemaining(
							item.order.createdAt,
							item.order.deliveredAt,
							item.order.completedAt
						);

						return (
							<div
								key={`${item.product._id}-${item.order._id}`}
								className="bg-gray-800 p-6 rounded-lg"
							>
								<div className="flex items-start space-x-4">
									<img
										src={item.product.images?.[0] || "/placeholder-image.jpg"}
										alt={item.product.name}
										className="w-20 h-20 object-cover rounded-lg"
									/>
									
									<div className="flex-1">
										<h3 className="text-lg font-medium text-white mb-1">
											{item.product.name}
										</h3>
												<div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
											<div className="flex items-center space-x-1">
												<Calendar size={14} />
												<span>
													Ordered: {new Date(item.order.createdAt).toLocaleDateString()}
												</span>
											</div>
											
											{item.order.deliveredAt && (
												<div className="flex items-center space-x-1">
													<Package size={14} />
													<span>
														Delivered: {new Date(item.order.deliveredAt).toLocaleDateString()}
													</span>
												</div>
											)}
											
											{item.order.completedAt && (
												<div className="flex items-center space-x-1">
													<Package size={14} />
													<span>
														Completed: {new Date(item.order.completedAt).toLocaleDateString()}
													</span>
												</div>
											)}
											
											<div className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 capitalize">
												{item.order.status}
											</div>
										</div>

										<div className="flex items-center justify-between">
											<div className="text-sm text-gray-400">
												<span className="font-medium text-emerald-400">
													${item.price}
												</span>
												{item.quantity > 1 && (
													<span className="ml-2">
														Qty: {item.quantity}
													</span>
												)}
											</div>

											<div className="flex items-center space-x-3">
												{daysRemaining > 0 ? (
													<>
														<span className="text-xs text-orange-400">
															{daysRemaining} days left to review
														</span>
														<button
															onClick={() => handleStartReview(item)}
															className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
														>
															Write Review
														</button>
													</>
												) : (
													<span className="text-xs text-red-400">
														Review period expired
													</span>
												)}
											</div>
										</div>

										{/* Progress bar for time remaining */}
										<div className="mt-3">
											<div className="flex justify-between text-xs text-gray-400 mb-1">
												<span>Review deadline</span>
												<span>{daysRemaining}/90 days remaining</span>
											</div>
											<div className="w-full bg-gray-700 rounded-full h-2">
												<div
													className={`h-2 rounded-full transition-all ${
														daysRemaining > 30
															? "bg-emerald-500"
															: daysRemaining > 7
															? "bg-yellow-500"
															: "bg-red-500"
													}`}
													style={{
														width: `${Math.max(5, (daysRemaining / 90) * 100)}%`,
													}}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{reviewableProducts.length > 0 && (
				<div className="mt-8 p-4 bg-gray-800 rounded-lg">
					<h4 className="font-medium text-white mb-2">Review Guidelines</h4>
					<ul className="text-sm text-gray-400 space-y-1">
						<li>• Be honest and helpful in your review</li>
						<li>• Focus on the product's features, quality, and your experience</li>
						<li>• You can edit your review for 30 days after posting</li>
						<li>• Reviews must be based on your actual purchase experience</li>
						<li>• Inappropriate content will be removed</li>
					</ul>
				</div>
			)}
		</div>
	);
};

export default ReviewableProducts;
