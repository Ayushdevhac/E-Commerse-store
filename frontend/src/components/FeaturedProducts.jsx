import { useEffect, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight, Star, Heart, Eye } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useUserStore } from "../stores/useUserStore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import showToast from "../lib/toast";

const FeaturedProducts = ({ featuredProducts }) => {
	// Early return if no featured products
	if (!featuredProducts || featuredProducts.length === 0) {
		return null;
	}

	const [currentIndex, setCurrentIndex] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(4);
	const [hoveredProduct, setHoveredProduct] = useState(null);

	const { addToCart } = useCartStore();
	const { user } = useUserStore();
	const { toggleWishlist, isInWishlist } = useWishlistStore();
	const navigate = useNavigate();

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 640) setItemsPerPage(1);
			else if (window.innerWidth < 1024) setItemsPerPage(2);
			else if (window.innerWidth < 1280) setItemsPerPage(3);
			else setItemsPerPage(4);
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);
	const nextSlide = () => {
		setCurrentIndex((prevIndex) => prevIndex + itemsPerPage);
	};

	const prevSlide = () => {
		setCurrentIndex((prevIndex) => prevIndex - itemsPerPage);
	};
	const handleAddToCart = (e, product) => {
		e.stopPropagation();
		if (!user) {
			showToast.error("Please login to add products to cart");
			return;
		}
		addToCart(product);
	};

	const handleWishlistToggle = async (e, productId) => {
		e.stopPropagation();
		if (!user) {
			showToast.error("Please login to add to wishlist");
			return;
		}
		await toggleWishlist(productId);
	};

	const handleProductClick = (productId) => {
		navigate(`/product/${productId}`);
	};

	const isStartDisabled = currentIndex === 0;
	const isEndDisabled = currentIndex >= featuredProducts.length - itemsPerPage;
	return (
		<div className='py-16 bg-gradient-to-b from-gray-900 to-gray-800'>
			<div className='container mx-auto px-4'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className='text-center mb-12'
				>
					<h2 className='text-5xl sm:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4'>
						Featured Products
					</h2>
					<p className='text-xl text-gray-300 max-w-2xl mx-auto'>
						Discover our handpicked selection of premium products
					</p>
					<div className='w-20 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 mx-auto mt-4 rounded-full'></div>
				</motion.div>

				<div className='relative'>
					<div className='overflow-hidden rounded-2xl'>
						<motion.div
							className='flex transition-transform duration-500 ease-out'
							style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
							layout
						>
							{featuredProducts?.map((product, index) => (
								<motion.div
									key={product._id}
									className='w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-3'
									initial={{ opacity: 0, y: 50 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: index * 0.1 }}
									onMouseEnter={() => setHoveredProduct(product._id)}
									onMouseLeave={() => setHoveredProduct(null)}
								>
									<motion.div
										className='bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden h-full border border-gray-700/50 cursor-pointer group'
										whileHover={{ 
											scale: 1.03,
											boxShadow: "0 20px 40px rgba(16, 185, 129, 0.15)"
										}}
										transition={{ duration: 0.3 }}
										onClick={() => handleProductClick(product._id)}
									>
										<div className='relative overflow-hidden'>
											<motion.img
												src={product.image}
												alt={product.name}
												className='w-full h-56 object-cover'
												whileHover={{ scale: 1.1 }}
												transition={{ duration: 0.4 }}
											/>
											
											{/* Gradient overlay */}
											<div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
											
											{/* Action buttons overlay */}
											<AnimatePresence>
												{hoveredProduct === product._id && (
													<motion.div
														initial={{ opacity: 0, y: 20 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, y: 20 }}
														className='absolute top-4 right-4 flex flex-col gap-2'
													>
														<motion.button
															whileHover={{ scale: 1.1 }}
															whileTap={{ scale: 0.9 }}
															onClick={(e) => handleWishlistToggle(e, product._id)}
															className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
																user && isInWishlist(product._id)
																	? "bg-red-500 text-white"
																	: "bg-white/20 text-white hover:bg-red-500"
															}`}
														>
															<Heart className={`w-4 h-4 ${user && isInWishlist(product._id) ? "fill-current" : ""}`} />
														</motion.button>
														<motion.button
															whileHover={{ scale: 1.1 }}
															whileTap={{ scale: 0.9 }}
															onClick={(e) => {
																e.stopPropagation();
																handleProductClick(product._id);
															}}
															className='p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-emerald-500 transition-colors'
														>
															<Eye className='w-4 h-4' />
														</motion.button>
													</motion.div>
												)}
											</AnimatePresence>

											{/* Featured badge */}
											<div className='absolute top-4 left-4'>
												<span className='px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-semibold rounded-full'>
													Featured
												</span>
											</div>
										</div>

										<div className='p-6'>
											<div className='flex items-center justify-between mb-2'>
												<h3 className='text-lg font-semibold text-white truncate group-hover:text-emerald-400 transition-colors'>
													{product.name}
												</h3>
												<div className='flex items-center'>
													{[...Array(5)].map((_, i) => (
														<Star
															key={i}
															className={`w-3 h-3 ${
																i < 4 ? "text-yellow-400 fill-current" : "text-gray-600"
															}`}
														/>
													))}
												</div>
											</div>
											
											<p className='text-gray-400 text-sm mb-4 line-clamp-2'>
												Premium quality product with excellent craftsmanship
											</p>
											
											<div className='flex items-center justify-between mb-4'>
												<span className='text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent'>
													${product.price.toFixed(2)}
												</span>
												<span className='text-sm text-gray-500 line-through'>
													${(product.price * 1.2).toFixed(2)}
												</span>
											</div>

											<motion.button
												onClick={(e) => handleAddToCart(e, product)}
												className='w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn'
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
											>
												<ShoppingCart className='w-5 h-5 group-hover/btn:animate-bounce' />
												Add to Cart
											</motion.button>
										</div>
									</motion.div>
								</motion.div>
							))}
						</motion.div>
					</div>

					{/* Navigation buttons */}
					<motion.button
						onClick={prevSlide}
						disabled={isStartDisabled}
						className={`absolute top-1/2 -left-6 transform -translate-y-1/2 p-3 rounded-full transition-all duration-300 backdrop-blur-sm border ${
							isStartDisabled 
								? "bg-gray-600/50 cursor-not-allowed border-gray-600 text-gray-400" 
								: "bg-emerald-600/90 hover:bg-emerald-500 border-emerald-500 text-white hover:scale-110"
						}`}
						whileHover={!isStartDisabled ? { scale: 1.1 } : {}}
						whileTap={!isStartDisabled ? { scale: 0.9 } : {}}
					>
						<ChevronLeft className='w-6 h-6' />
					</motion.button>

					<motion.button
						onClick={nextSlide}
						disabled={isEndDisabled}
						className={`absolute top-1/2 -right-6 transform -translate-y-1/2 p-3 rounded-full transition-all duration-300 backdrop-blur-sm border ${
							isEndDisabled 
								? "bg-gray-600/50 cursor-not-allowed border-gray-600 text-gray-400" 
								: "bg-emerald-600/90 hover:bg-emerald-500 border-emerald-500 text-white hover:scale-110"
						}`}
						whileHover={!isEndDisabled ? { scale: 1.1 } : {}}
						whileTap={!isEndDisabled ? { scale: 0.9 } : {}}
					>
						<ChevronRight className='w-6 h-6' />
					</motion.button>

					{/* Pagination dots */}
					<div className='flex justify-center mt-8 gap-2'>
						{Array.from({ length: Math.ceil(featuredProducts.length / itemsPerPage) }).map((_, index) => (
							<motion.button
								key={index}
								onClick={() => setCurrentIndex(index * itemsPerPage)}
								className={`w-3 h-3 rounded-full transition-all duration-300 ${
									Math.floor(currentIndex / itemsPerPage) === index
										? "bg-emerald-500 scale-125"
										: "bg-gray-600 hover:bg-gray-500"
								}`}
								whileHover={{ scale: 1.2 }}
								whileTap={{ scale: 0.9 }}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
export default FeaturedProducts;
