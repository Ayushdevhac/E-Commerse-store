import { motion } from "framer-motion";
import { Trash, Star, Search, Filter } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import useCategoryStore from "../stores/useCategoryStore";
import { useState, useEffect } from "react";
import Pagination from "./Pagination";
import ProductFilters from "./ProductFilters";
import LoadingSpinner from "./LoadingSpinner";

const ProductsList = () => {
	const { 
		deleteProduct, 
		toggleFeaturedProduct, 
		products, 
		loading, 
		pagination,
		filters,
		fetchAllProducts,
		setFilters,
		clearProducts,
		fetchProductCategories
	} = useProductStore();

	const { categories, fetchCategories } = useCategoryStore();

	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [productCategories, setProductCategories] = useState([]);

	useEffect(() => {
		// Load products with initial filters
		fetchAllProducts(1, { sort: '-createdAt' });
		// Load categories for management (these have proper category objects)
		fetchCategories();
		// Load product categories for filtering (these are aggregated from products)
		fetchProductCategories().then(setProductCategories);
	}, [fetchAllProducts, fetchCategories, fetchProductCategories]);

	const handlePageChange = (page) => {
		fetchAllProducts(page, filters);
	};

	const handleFiltersChange = (newFilters) => {
		setFilters(newFilters);
		fetchAllProducts(1, newFilters);
	};

	const handleSearch = (e) => {
		e.preventDefault();
		const newFilters = { ...filters, search: searchTerm };
		handleFiltersChange(newFilters);
	};

	const handleClearFilters = () => {
		const clearedFilters = {
			category: null,
			minPrice: 0,
			maxPrice: null,
			search: '',
			sort: '-createdAt'
		};
		setFilters(clearedFilters);
		setSearchTerm('');
		fetchAllProducts(1, clearedFilters);
	};

	if (loading && products.length === 0) {
		return <LoadingSpinner />;
	}

	return (
		<div className="space-y-6">
			{/* Search and Filter Section */}
			<div className="bg-gray-800 rounded-lg p-4">
				<div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
					<h2 className="text-2xl font-bold text-emerald-400">Products Management</h2>
					
					{/* Search Bar */}
					<form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
						<div className="relative flex-1 md:w-64">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
							<input
								type="text"
								placeholder="Search products..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-gray-700 text-gray-300 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
							/>
						</div>
						<motion.button
							type="submit"
							className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							Search
						</motion.button>
					</form>
				</div>

				{/* Toggle Filters */}
				<motion.button
					onClick={() => setShowFilters(!showFilters)}
					className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors mb-4"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					<Filter size={16} />
					{showFilters ? 'Hide Filters' : 'Show Filters'}
				</motion.button>

				{/* Filters */}
				{showFilters && (
					<ProductFilters
						filters={filters}
						categories={productCategories}
						onFiltersChange={handleFiltersChange}
						onClearFilters={handleClearFilters}
						isLoading={loading}
					/>
				)}
			</div>

			{/* Products Table */}
			<motion.div
				className='bg-gray-800 shadow-lg rounded-lg overflow-hidden'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				{/* Products Count */}
				<div className="px-6 py-4 border-b border-gray-700">
					<p className="text-gray-300">
						Showing {products.length} of {pagination.totalProducts} products
					</p>
				</div>

				<div className="overflow-x-auto">
					<table className='min-w-full divide-y divide-gray-700'>
						<thead className='bg-gray-700'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
									Product
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
									Price
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
									Category
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
									Featured
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
									Actions
								</th>
							</tr>
						</thead>
						
						<tbody className='bg-gray-800 divide-y divide-gray-700'>
							{products?.length === 0 ? (
								<tr>
									<td colSpan="5" className="px-6 py-8 text-center">
										<div className="text-gray-400">
											{loading ? 'Loading products...' : 'No products found'}
										</div>
									</td>
								</tr>
							) : (
								products?.map((product) => (
									<tr key={product._id} className='hover:bg-gray-700 transition-colors'>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='flex items-center'>
												<div className='flex-shrink-0 h-12 w-12'>
													<img
														className='h-12 w-12 rounded-lg object-cover'
														src={product.image}
														alt={product.name}
														onError={(e) => {
															e.target.src = '/placeholder-image.jpg';
														}}
													/>
												</div>
												<div className='ml-4'>
													<div className='text-sm font-medium text-white truncate max-w-xs'>
														{product.name}
													</div>
													<div className='text-xs text-gray-400 truncate max-w-xs'>
														{product.description}
													</div>
												</div>
											</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='text-sm font-semibold text-emerald-400'>
												${product.price.toFixed(2)}
											</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<span className='px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded-full'>
												{product.category}
											</span>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<motion.button
												onClick={() => toggleFeaturedProduct(product._id)}
												className={`p-2 rounded-full transition-all duration-200 ${
													product.isFeatured 
														? "bg-yellow-400 text-gray-900 shadow-lg" 
														: "bg-gray-600 text-gray-300 hover:bg-gray-500"
												}`}
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												disabled={loading}
											>
												<Star className='h-4 w-4' fill={product.isFeatured ? 'currentColor' : 'none'} />
											</motion.button>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<motion.button
												onClick={() => deleteProduct(product._id)}
												className='p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-full transition-all duration-200'
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												disabled={loading}
											>
												<Trash className='h-4 w-4' />
											</motion.button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{pagination.totalPages > 1 && (
					<div className="px-6 py-4 border-t border-gray-700">
						<Pagination
							currentPage={pagination.currentPage}
							totalPages={pagination.totalPages}
							totalProducts={pagination.totalProducts}
							limit={pagination.limit}
							onPageChange={handlePageChange}
						/>
					</div>
				)}
			</motion.div>
		</div>
	);
};

export default ProductsList;
