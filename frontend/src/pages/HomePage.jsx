import { useEffect } from "react";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import useCategoryStore from "../stores/useCategoryStore";
import FeaturedProducts from "../components/FeaturedProducts";
// import TestPaymentComponent from "../components/TestPaymentComponent"; // Temporarily commented
import { motion } from "framer-motion";
import { ShoppingBag, Truck, Shield, RefreshCw } from "lucide-react";

const HomePage = () => {
	const { fetchFeaturedProducts, products, isLoading } = useProductStore();
	const { activeCategories, fetchActiveCategories } = useCategoryStore();	useEffect(() => {
		fetchFeaturedProducts();
		fetchActiveCategories();
	}, [fetchFeaturedProducts, fetchActiveCategories]);
		// Refresh featured products when user returns to the page
	useEffect(() => {
		const handleFocus = () => {
			fetchFeaturedProducts();
			fetchActiveCategories();
		};
		
		window.addEventListener('focus', handleFocus);
		return () => window.removeEventListener('focus', handleFocus);
	}, [fetchFeaturedProducts, fetchActiveCategories]);

	return (
		<div className='relative min-h-screen text-white pb-16'>
			{/* Enhanced background with animated elements */}
			<div className='absolute inset-0 pointer-events-none min-h-full'>
				<div className='absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-full'></div>
				<div className='absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse'></div>
				<div className='absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
			</div>

			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				{/* Hero Section */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className='text-center mb-16'
				>
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className='text-6xl sm:text-7xl lg:text-8xl font-bold mb-6'
					>
						<span className='bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent'>
							Shop
						</span>
						<br />
						<span className='text-white'>The Future</span>
					</motion.h1>
					
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className='text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed'
					>
						Discover premium products with cutting-edge design and sustainable innovation
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.6 }}
						className='flex flex-wrap justify-center gap-4 mb-12'
					>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center gap-2 shadow-lg'
						>
							<ShoppingBag className='w-5 h-5' />
							Start Shopping
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-gray-900 font-semibold py-4 px-8 rounded-2xl transition-all duration-300'
						>
							Learn More
						</motion.button>
					</motion.div>

					{/* Features */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.8 }}
						className='grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16'
					>
						{[
							{ icon: Truck, title: "Free Shipping", desc: "On orders over $100" },
							{ icon: Shield, title: "Secure Payment", desc: "100% protected checkout" },
							{ icon: RefreshCw, title: "Easy Returns", desc: "30-day return policy" }
						].map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
								className='flex flex-col items-center text-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50'
							>
								<feature.icon className='w-8 h-8 text-emerald-400 mb-3' />
								<h3 className='font-semibold text-white mb-1'>{feature.title}</h3>
								<p className='text-sm text-gray-400'>{feature.desc}</p>
							</motion.div>
						))}
					</motion.div>
				</motion.div>				{/* Categories Section */}
				<motion.div
					id="categories"
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.4 }}
				>
					<h2 className='text-center text-4xl sm:text-5xl font-bold mb-4'>
						<span className='bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent'>
							Explore Categories
						</span>
					</h2>
					<p className='text-center text-xl text-gray-300 mb-12'>
						Find exactly what you're looking for
					</p>					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16'>
						{activeCategories.map((category, index) => (
							<motion.div
								key={category._id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
							>
								<CategoryItem category={{
									href: category.slug,
									name: category.name,
									imageUrl: category.image
								}} />
							</motion.div>
						))}
					</div>
				</motion.div>				{/* Featured Products */}
				{!isLoading && products.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.8 }}
					>
						<FeaturedProducts featuredProducts={products} />
					</motion.div>
				)}

				{/* No Featured Products Fallback */}
				{!isLoading && products.length === 0 && (
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.8 }}
						className="text-center py-12"
					>
						<div className="max-w-md mx-auto">
							<div className="text-6xl mb-4">🌟</div>
							<h3 className="text-xl font-semibold text-white mb-2">
								No Featured Products Yet
							</h3>
							<p className="text-gray-400 mb-6">
								Our team is curating amazing products for you. Check back soon or explore our categories!
							</p>
							<button
								onClick={() => window.location.href = '#categories'}
								className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
							>
								Browse Categories
							</button>
						</div>
					</motion.div>
				)}

				{/* Test Component - Temporarily commented out */}
				{/* 
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 1.0 }}
					className="mt-12"
				>
					<TestPaymentComponent />
				</motion.div>
				*/}
			</div>
		</div>
	);
};
export default HomePage;
