import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Share2, Star, ShoppingCart, Minus, Plus, Truck, Shield, RotateCcw } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import useCategoryStore from "../stores/useCategoryStore";
import { validateQuantity, getAvailableStock } from "../lib/stockValidation";
import { getCategoryDisplayName } from "../lib/categoryUtils";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import LoadingSpinner from "../components/LoadingSpinner";
import ReviewList from "../components/ReviewList";
import axios from "../lib/axios";
import showToast from "../lib/toast";

const ProductDetailPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useUserStore();
	const { addToCart } = useCartStore();
	const { wishlist, getWishlist, toggleWishlist: toggleWishlistAction, isInWishlist } = useWishlistStore();	
	const { activeCategories, fetchActiveCategories } = useCategoryStore();

	const [product, setProduct] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedImage, setSelectedImage] = useState(0);
	const [quantity, setQuantity] = useState(1);
	const [selectedSize, setSelectedSize] = useState(null);
	const [activeTab, setActiveTab] = useState("description");	useEffect(() => {
		// Fetch categories for proper display names
		fetchActiveCategories();
		
		const fetchProduct = async () => {
			try {
				setLoading(true);
				const response = await axios.get(`/products/${id}`);
				setProduct(response.data);
				// Set default size if product has sizes
				if (response.data.sizes && response.data.sizes.length > 0) {
					setSelectedSize(response.data.sizes[0]);
				}
				// Reset quantity to 1 when loading a new product
				setQuantity(1);
			} catch (error) {
				console.error("Error fetching product:", error);
				showToast.error("Failed to load product");
				navigate("/");
			} finally {
				setLoading(false);
			}
		};

		if (id) {
			fetchProduct();
		}
	}, [id, navigate, fetchActiveCategories]);

	useEffect(() => {
		if (user) {
			getWishlist();
		}
	}, [user, getWishlist]);	const handleAddToCart = () => {
		if (!user) {
			showToast.error("Please login to add products to cart");
			return;
		}
				// Check if product has sizes and no size is selected
		if (product.sizes && product.sizes.length > 0 && !selectedSize) {
			showToast.error("Please select a size");
			return;
		}
		
		// Create product with selected size for validation and cart
		const productForCart = product.sizes && product.sizes.length > 0 
			? { ...product, selectedSize }
			: product;
		
		// Use shared validation utility
		const validation = validateQuantity(productForCart, selectedSize, quantity);
		if (!validation.isValid) {
			showToast.error(validation.message);
			return;
		}
		
		// Use the updated addToCart with quantity parameter
		addToCart(productForCart, quantity);
	};	const handleQuantityChange = (change) => {
		const newQuantity = quantity + change;
		
		// Use shared utility to get available stock
		const productForValidation = product.sizes && product.sizes.length > 0 
			? { ...product, selectedSize }
			: product;
		const maxStock = getAvailableStock(productForValidation, selectedSize);
		
		if (newQuantity >= 1 && newQuantity <= maxStock) {
			setQuantity(newQuantity);
		} else if (newQuantity > maxStock) {
			showToast.error(`Only ${maxStock} items available in stock${selectedSize ? ` for size ${selectedSize}` : ''}`);
		}
	};

	// Get available stock for current selection using shared utility
	const getCurrentAvailableStock = () => {
		const productForValidation = product.sizes && product.sizes.length > 0 
			? { ...product, selectedSize }
			: product;		return getAvailableStock(productForValidation, selectedSize);
	};

	const toggleWishlist = async () => {
		if (!user) {
			showToast.error("Please login to add to wishlist");
			return;
		}
		await toggleWishlistAction(product._id);
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	if (!product) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-white mb-4">Product not found</h2>
					<button
						onClick={() => navigate("/")}
						className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
					>
						Go Home
					</button>
				</div>
			</div>
		);
	}
	const mockImages = [product.image, product.image, product.image]; // Mock multiple images

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Back Button */}
				<motion.button
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					onClick={() => navigate(-1)}
					className="flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
				>
					<ArrowLeft className="w-5 h-5 mr-2" />
					Back
				</motion.button>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
					{/* Product Images */}
					<motion.div
						initial={{ opacity: 0, x: -50 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6 }}
					>
						<div className="space-y-4">
							<div className="aspect-square overflow-hidden rounded-2xl bg-gray-800">
								<img
									src={mockImages[selectedImage]}
									alt={product.name}
									className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
								/>
							</div>
							
							{/* Thumbnail Images */}
							<div className="flex space-x-4">
								{mockImages.map((image, index) => (
									<button
										key={index}
										onClick={() => setSelectedImage(index)}
										className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
											selectedImage === index
												? "border-emerald-500 ring-2 ring-emerald-500/30"
												: "border-gray-600 hover:border-gray-500"
										}`}
									>
										<img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
									</button>
								))}
							</div>
						</div>
					</motion.div>

					{/* Product Info */}
					<motion.div
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="space-y-6"
					>
						<div>
							<h1 className="text-4xl font-bold text-white mb-2">{product.name}</h1>
							<div className="flex items-center space-x-4 mb-4">
								<div className="flex items-center">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className={`w-5 h-5 ${
												i < 4 ? "text-yellow-400 fill-current" : "text-gray-600"
											}`}
										/>
									))}
									<span className="ml-2 text-gray-300">(4.0) • 156 reviews</span>
								</div>
							</div>							<p className="text-6xl font-bold text-emerald-400 mb-6">${product.price}</p>
						</div>						{/* Size Selector */}
						{product.sizes && product.sizes.length > 0 && (
							<div className="space-y-3">
								<h3 className="text-lg font-medium text-white">Size:</h3>
								<div className="flex flex-wrap gap-3">
									{product.sizes.map((size) => {
										const sizeStock = product.stock && (product.stock.get ? product.stock.get(size) : product.stock[size]);
										const isOutOfStock = !sizeStock || sizeStock === 0;
										
										return (
											<button
												key={size}
												onClick={() => {
													setSelectedSize(size);
													// Reset quantity to 1 when changing size to avoid invalid quantities
													setQuantity(1);
												}}
												disabled={isOutOfStock}
												className={`px-4 py-2 rounded-lg border-2 font-medium transition-all relative ${
													selectedSize === size
														? 'border-emerald-500 bg-emerald-500 text-white'
														: isOutOfStock
														? 'border-gray-600 bg-gray-900 text-gray-500 cursor-not-allowed'
														: 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
												}`}
											>
												{size}
												{isOutOfStock && (
													<span className="absolute inset-0 flex items-center justify-center">
														<span className="bg-red-600 text-white text-xs px-1 rounded transform rotate-12">
															OUT
														</span>
													</span>
												)}
											</button>
										);
									})}
								</div>
								{selectedSize && (
									<p className="text-sm text-gray-400">
										Selected size: <span className="text-emerald-400 font-medium">{selectedSize}</span>
										{getCurrentAvailableStock() > 0 && (
											<span className="ml-2 text-gray-500">({getCurrentAvailableStock()} available)</span>
										)}
									</p>
								)}
							</div>
						)}

						{/* Stock Information */}
						{product.stock && (
							<div className="bg-gray-800 rounded-lg p-4">
								<h4 className="font-medium text-white mb-2">Stock Information:</h4>
								{product.sizes && product.sizes.length > 0 ? (
									<div className="grid grid-cols-3 gap-2 text-sm">
										{product.sizes.map((size) => {
											const stock = product.stock.get ? product.stock.get(size) : product.stock[size];
											return (
												<div key={size} className="flex justify-between">
													<span className="text-gray-300">{size}:</span>
													<span className={stock > 5 ? 'text-green-400' : stock > 0 ? 'text-yellow-400' : 'text-red-400'}>
														{stock || 0}
													</span>
												</div>
											);
										})}
									</div>
								) : (
									<div className="text-sm">
										{(() => {
											const availableStock = getCurrentAvailableStock();
											return (
												<span className={`${availableStock > 10 ? 'text-green-400' : availableStock > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
													{availableStock > 0 ? `${availableStock} in stock` : 'Out of stock'}
												</span>
											);
										})()}
									</div>
								)}
							</div>
						)}						{/* Quantity Selector */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-lg font-medium">Quantity:</span>
								<span className="text-sm text-gray-400">
									{getCurrentAvailableStock() > 0 ? `${getCurrentAvailableStock()} available` : 'Out of stock'}
								</span>
							</div>
							<div className="flex items-center bg-gray-800 rounded-lg">
								<button
									onClick={() => handleQuantityChange(-1)}
									disabled={quantity <= 1}
									className="p-2 hover:bg-gray-700 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Minus className="w-4 h-4" />
								</button>
								<span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
								<button
									onClick={() => handleQuantityChange(1)}
									disabled={quantity >= getCurrentAvailableStock() || getCurrentAvailableStock() === 0}
									className="p-2 hover:bg-gray-700 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Plus className="w-4 h-4" />
								</button>
							</div>							{quantity === getCurrentAvailableStock() && getCurrentAvailableStock() > 0 && (
								<p className="text-sm text-yellow-400">
									Maximum quantity reached
								</p>
							)}
							{getCurrentAvailableStock() > 0 && getCurrentAvailableStock() <= 5 && (
								<p className="text-sm text-orange-400">
									⚠️ Only {getCurrentAvailableStock()} left in stock!
								</p>
							)}
						</div>						{/* Action Buttons */}
						<div className="flex space-x-4">
							<button
								onClick={handleAddToCart}
								disabled={getCurrentAvailableStock() === 0 || (product.sizes && product.sizes.length > 0 && !selectedSize)}
								className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<ShoppingCart className="w-5 h-5 mr-2" />
								{getCurrentAvailableStock() === 0 ? 'Out of Stock' : 'Add to Cart'}
							</button><button
								onClick={toggleWishlist}
								className={`p-3 rounded-lg border transition-colors ${
									product && isInWishlist(product._id)
										? "bg-red-600 border-red-600 text-white"
										: "border-gray-600 text-gray-300 hover:border-gray-500"
								}`}
							>
								<Heart className={`w-5 h-5 ${product && isInWishlist(product._id) ? "fill-current" : ""}`} />
							</button>
							<button className="p-3 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 transition-colors">
								<Share2 className="w-5 h-5" />
							</button>
						</div>

						{/* Features */}
						<div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-700">
							<div className="text-center">
								<Truck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
								<p className="text-sm text-gray-300">Free Shipping</p>
							</div>
							<div className="text-center">
								<Shield className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
								<p className="text-sm text-gray-300">Secure Payment</p>
							</div>
							<div className="text-center">
								<RotateCcw className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
								<p className="text-sm text-gray-300">Easy Returns</p>
							</div>
						</div>
					</motion.div>
				</div>

				{/* Product Details Tabs */}
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.4 }}
					className="mt-16"
				>
					<div className="border-b border-gray-700">
						<nav className="flex space-x-8">
							{["description", "reviews", "shipping"].map((tab) => (
								<button
									key={tab}
									onClick={() => setActiveTab(tab)}
									className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
										activeTab === tab
											? "border-emerald-500 text-emerald-400"
											: "border-transparent text-gray-400 hover:text-gray-300"
									}`}
								>
									{tab.charAt(0).toUpperCase() + tab.slice(1)}
								</button>
							))}
						</nav>
					</div>

					<div className="py-8">
						{activeTab === "description" && (
							<div className="prose prose-invert max-w-none">
								<p className="text-lg text-gray-300 leading-relaxed">
									{product.description || "This is a high-quality product crafted with attention to detail. Perfect for those who appreciate both style and functionality. Made with premium materials to ensure durability and comfort."}
								</p>
								<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<h3 className="text-xl font-semibold text-white mb-4">Features</h3>
										<ul className="space-y-2 text-gray-300">
											<li>• Premium quality materials</li>
											<li>• Durable construction</li>
											<li>• Comfortable fit</li>
											<li>• Easy to maintain</li>
										</ul>
									</div>
									<div>
										<h3 className="text-xl font-semibold text-white mb-4">Specifications</h3>
										<ul className="space-y-2 text-gray-300">
											<li>• Category: {getCategoryDisplayName(product.category, activeCategories)}</li>
											<li>• Material: Premium Cotton</li>
											<li>• Care: Machine washable</li>
											<li>• Origin: Made with care</li>
										</ul>
									</div>
								</div>
							</div>
						)}						{activeTab === "reviews" && (
							<div>
								<div className="flex items-center justify-between mb-8">
									<h3 className="text-2xl font-semibold text-white">Customer Reviews</h3>
									{user && (
										<button 
											onClick={() => navigate("/reviews")}
											className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
										>
											Write a Review
										</button>
									)}
								</div>
								
								<ReviewList productId={product._id} />
							</div>
						)}

						{activeTab === "shipping" && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div>
									<h3 className="text-xl font-semibold text-white mb-4">Shipping Options</h3>
									<div className="space-y-4">
										<div className="flex justify-between p-4 bg-gray-800 rounded-lg">
											<div>
												<p className="font-medium text-white">Standard Shipping</p>
												<p className="text-sm text-gray-400">5-7 business days</p>
											</div>
											<span className="text-emerald-400 font-medium">Free</span>
										</div>
										<div className="flex justify-between p-4 bg-gray-800 rounded-lg">
											<div>
												<p className="font-medium text-white">Express Shipping</p>
												<p className="text-sm text-gray-400">2-3 business days</p>
											</div>
											<span className="text-white font-medium">$9.99</span>
										</div>
										<div className="flex justify-between p-4 bg-gray-800 rounded-lg">
											<div>
												<p className="font-medium text-white">Next Day Delivery</p>
												<p className="text-sm text-gray-400">1 business day</p>
											</div>
											<span className="text-white font-medium">$19.99</span>
										</div>
									</div>
								</div>
								<div>
									<h3 className="text-xl font-semibold text-white mb-4">Return Policy</h3>
									<div className="space-y-4 text-gray-300">
										<p>• 30-day return policy</p>
										<p>• Free returns on all orders</p>
										<p>• Items must be in original condition</p>
										<p>• Refund processed within 5-7 business days</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</motion.div>

				{/* Related Products */}
				<PeopleAlsoBought />
			</div>
		</div>
	);
};

export default ProductDetailPage;
