import { useEffect } from "react";
import { useProductStore } from "../stores/useProductStore";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";

const CategoryPage = () => {
	const { fetchProductsByCategory, products, loading, clearProducts } = useProductStore();

	const { category } = useParams();
	
	useEffect(() => {
		// Clear products when component mounts or category changes
		clearProducts();
	}, [category, clearProducts]);
		useEffect(() => {
		if (category) {
			fetchProductsByCategory(category);
		}
	}, [fetchProductsByCategory, category]);

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<div className='min-h-screen bg-gray-900'>
			<div className='relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<motion.h1
					className='text-center text-4xl sm:text-5xl font-bold text-emerald-400 mb-8'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					{category?.charAt(0).toUpperCase() + category?.slice(1) || "Category"}
				</motion.h1>

				<motion.div
					className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}				>
					{products?.length === 0 && !loading && (
						<div className='col-span-full text-center'>
							<h2 className='text-3xl font-semibold text-gray-300 mb-4'>
								No products found
							</h2>
							<p className='text-gray-400'>
								We don't have any products in the "{category}" category yet.
							</p>
							<p className='text-gray-500 mt-2'>
								Check back soon for new arrivals!
							</p>
						</div>
					)}

					{products?.map((product) => (
						<ProductCard key={product._id} product={product} />
					))}
				</motion.div>
			</div>
		</div>
	);
};
export default CategoryPage;
