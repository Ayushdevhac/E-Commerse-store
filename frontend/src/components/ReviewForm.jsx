import { useState } from "react";
import { Star, Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "../lib/axios";

const ReviewForm = ({ product, order, onSubmit, onCancel }) => {
	const [formData, setFormData] = useState({
		rating: 0,
		title: "",
		comment: "",
		images: []
	});
	const [hoveredRating, setHoveredRating] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [previewImages, setPreviewImages] = useState([]);

	const handleRatingClick = (rating) => {
		setFormData(prev => ({ ...prev, rating }));
	};

	const handleImageUpload = (e) => {
		const files = Array.from(e.target.files);
		
		if (formData.images.length + files.length > 5) {
			toast.error("You can upload maximum 5 images");
			return;
		}

		// Create preview URLs
		const newPreviews = files.map(file => URL.createObjectURL(file));
		setPreviewImages(prev => [...prev, ...newPreviews]);
		
		// TODO: Upload to cloudinary and get URLs
		// For now, we'll just store the file names
		const imageUrls = files.map(file => file.name);
		setFormData(prev => ({
			...prev,
			images: [...prev.images, ...imageUrls]
		}));
	};

	const removeImage = (index) => {
		setFormData(prev => ({
			...prev,
			images: prev.images.filter((_, i) => i !== index)
		}));
		setPreviewImages(prev => {
			URL.revokeObjectURL(prev[index]);
			return prev.filter((_, i) => i !== index);
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (formData.rating === 0) {
			toast.error("Please select a rating");
			return;
		}

		if (!formData.title.trim()) {
			toast.error("Please enter a review title");
			return;
		}

		if (!formData.comment.trim()) {
			toast.error("Please enter a review comment");
			return;
		}

		setIsSubmitting(true);

		try {
			const reviewData = {
				productId: product._id,
				orderId: order._id,
				rating: formData.rating,
				title: formData.title.trim(),
				comment: formData.comment.trim(),
				images: formData.images
			};

			const response = await axios.post("/reviews", reviewData);
			
			toast.success("Review submitted successfully!");
			onSubmit(response.data.review);
			
			// Reset form
			setFormData({
				rating: 0,
				title: "",
				comment: "",
				images: []
			});
			setPreviewImages([]);
			
		} catch (error) {
			console.error("Error submitting review:", error);
			toast.error(error.response?.data?.message || "Failed to submit review");
		} finally {
			setIsSubmitting(false);
		}
	};

	const getRatingText = (rating) => {
		const texts = {
			1: "Poor",
			2: "Fair", 
			3: "Good",
			4: "Very Good",
			5: "Excellent"
		};
		return texts[rating] || "";
	};

	return (
		<div className="bg-gray-800 p-6 rounded-lg">
			<h3 className="text-xl font-semibold text-white mb-4">
				Write a Review for {product.name}
			</h3>
			
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Rating */}
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2">
						Rating
					</label>
					<div className="flex items-center space-x-1">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								onClick={() => handleRatingClick(star)}
								onMouseEnter={() => setHoveredRating(star)}
								onMouseLeave={() => setHoveredRating(0)}
								className={`p-1 transition-colors ${
									star <= (hoveredRating || formData.rating)
										? "text-yellow-400"
										: "text-gray-600"
								}`}
							>
								<Star 
									size={24} 
									fill={star <= (hoveredRating || formData.rating) ? "currentColor" : "none"}
								/>
							</button>
						))}
						{(hoveredRating || formData.rating) > 0 && (
							<span className="ml-2 text-sm text-gray-400">
								{getRatingText(hoveredRating || formData.rating)}
							</span>
						)}
					</div>
				</div>

				{/* Title */}
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2">
						Review Title
					</label>
					<input
						type="text"
						value={formData.title}
						onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
						placeholder="Summarize your review in a few words"
						maxLength={100}
						className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
					/>
					<div className="text-xs text-gray-400 mt-1">
						{formData.title.length}/100 characters
					</div>
				</div>

				{/* Comment */}
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2">
						Your Review
					</label>
					<textarea
						value={formData.comment}
						onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
						placeholder="Share your thoughts about this product"
						maxLength={1000}
						rows={5}
						className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 resize-none"
					/>
					<div className="text-xs text-gray-400 mt-1">
						{formData.comment.length}/1000 characters
					</div>
				</div>

				{/* Image Upload */}
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2">
						Add Photos (Optional)
					</label>
					<div className="flex flex-wrap gap-2 mb-2">
						{previewImages.map((preview, index) => (
							<div key={index} className="relative">
								<img
									src={preview}
									alt={`Preview ${index + 1}`}
									className="w-20 h-20 object-cover rounded-lg"
								/>
								<button
									type="button"
									onClick={() => removeImage(index)}
									className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
								>
									<X size={12} />
								</button>
							</div>
						))}
						{formData.images.length < 5 && (
							<label className="w-20 h-20 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors">
								<Upload size={20} className="text-gray-400" />
								<input
									type="file"
									multiple
									accept="image/*"
									onChange={handleImageUpload}
									className="hidden"
								/>
							</label>
						)}
					</div>
					<p className="text-xs text-gray-400">
						Add up to 5 photos to help others with their purchase decision
					</p>
				</div>

				{/* Order Info */}
				<div className="bg-gray-700 p-3 rounded-lg">
					<p className="text-sm text-gray-300">
						<span className="font-medium">Order Date:</span>{" "}
						{new Date(order.createdAt).toLocaleDateString()}
					</p>
					{order.deliveredAt && (
						<p className="text-sm text-gray-300">
							<span className="font-medium">Delivered:</span>{" "}
							{new Date(order.deliveredAt).toLocaleDateString()}
						</p>
					)}
				</div>

				{/* Buttons */}
				<div className="flex space-x-3 pt-4">
					<button
						type="submit"
						disabled={isSubmitting}
						className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isSubmitting ? "Submitting..." : "Submit Review"}
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
};

export default ReviewForm;
