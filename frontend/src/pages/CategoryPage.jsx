import { useEffect, useState, useCallback, useRef } from "react";
import { useProductStore } from "../stores/useProductStore";
import useCategoryStore from "../stores/useCategoryStore";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import ProductFilters from "../components/ProductFilters";

const CategoryPage = () => {	const { 
		fetchProductsByCategory, 
		products, 
		loading, 
		clearProducts, 
		pagination,
		filters,
		productType
	} = useProductStore();
	const { getCategoryById, activeCategories, fetchActiveCategories } = useCategoryStore();

	const { category } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const [categoryInfo, setCategoryInfo] = useState(null);
	const [localFilters, setLocalFilters] = useState({
		sort: '-createdAt',
		minPrice: null,
		maxPrice: null,
		search: ''
	});
	const [isInitialized, setIsInitialized] = useState(false);
	const prevCategoryRef = useRef(null);

	// Get current page from URL
	const currentPage = parseInt(searchParams.get('page')) || 1;	// Initialize component and restore URL parameters if any
	useEffect(() => {
		// Restore filters from URL parameters on component mount
		const urlMinPrice = searchParams.get('minPrice');
		const urlMaxPrice = searchParams.get('maxPrice');
		const urlSearch = searchParams.get('search');
		const urlSort = searchParams.get('sort');

		if (urlMinPrice || urlMaxPrice || urlSearch || urlSort) {
			setLocalFilters({
				sort: urlSort || '-createdAt',
				minPrice: urlMinPrice ? parseFloat(urlMinPrice) : null,
				maxPrice: urlMaxPrice ? parseFloat(urlMaxPrice) : null,
				search: urlSearch || ''
			});
		}

		// Fetch active categories for filter dropdown
		fetchActiveCategories();
		setIsInitialized(true);
	}, [fetchActiveCategories, searchParams]);

	// Handle category changes
	useEffect(() => {
		if (category && prevCategoryRef.current !== category) {
			// Only clear products when switching to a different category
			if (prevCategoryRef.current !== null) {
				clearProducts();
				// Reset page and filters only when actually changing categories
				setSearchParams({ page: '1' });
				setLocalFilters({
					sort: '-createdAt',
					minPrice: null,
					maxPrice: null,
					search: ''
				});
			}
			
			// Fetch category info by slug
			getCategoryById(category).then(setCategoryInfo);
			prevCategoryRef.current = category;
		}
	}, [category, getCategoryById, clearProducts, setSearchParams]);

	// Memoized fetch function to prevent unnecessary re-renders
	const fetchProducts = useCallback(() => {
		if (category && isInitialized) {
			fetchProductsByCategory(category, currentPage, localFilters);
		}
	}, [fetchProductsByCategory, category, currentPage, localFilters, isInitialized]);

	// Fetch products when dependencies change
	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);
	const handlePageChange = (page) => {
		if (page !== currentPage) {
			// Update URL with current filters and new page
			const newParams = new URLSearchParams(searchParams);
			newParams.set('page', page.toString());
			setSearchParams(newParams);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const handleFiltersChange = useCallback((newFilters) => {
		// Only update if filters actually changed
		const filtersChanged = JSON.stringify(localFilters) !== JSON.stringify(newFilters);
		if (filtersChanged) {
			setLocalFilters(newFilters);
			
			// Update URL with new filters
			const newParams = new URLSearchParams();
			newParams.set('page', '1'); // Reset to page 1 when filters change
			
			if (newFilters.minPrice > 0) {
				newParams.set('minPrice', newFilters.minPrice.toString());
			}
			if (newFilters.maxPrice > 0) {
				newParams.set('maxPrice', newFilters.maxPrice.toString());
			}
			if (newFilters.search) {
				newParams.set('search', newFilters.search);
			}
			if (newFilters.sort && newFilters.sort !== '-createdAt') {
				newParams.set('sort', newFilters.sort);
			}
			
			setSearchParams(newParams);
		}
	}, [localFilters, setSearchParams]);

	const handleClearFilters = useCallback(() => {
		const clearedFilters = { 
			sort: '-createdAt',
			minPrice: null,
			maxPrice: null,
			search: ''
		};
		setLocalFilters(clearedFilters);
		// Clear URL parameters except page
		setSearchParams({ page: '1' });
	}, [setSearchParams]);

	if (loading || (productType && productType !== 'category' && isInitialized)) {
		return <LoadingSpinner />;
	}

	return (
		<div className='min-h-screen bg-gray-900'>
			<div className='relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>				<motion.h1
					className='text-center text-4xl sm:text-5xl font-bold text-emerald-400 mb-8'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					{categoryInfo?.name || category?.charAt(0).toUpperCase() + category?.slice(1) || "Category"}
				</motion.h1>

				{categoryInfo?.description && (
					<motion.p
						className='text-center text-xl text-gray-300 mb-8 max-w-3xl mx-auto'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.1 }}
					>
						{categoryInfo.description}
					</motion.p>
				)}				{/* Filters */}
				<motion.div
					className="mb-8"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
				>					<ProductFilters
						filters={localFilters}
						onFiltersChange={handleFiltersChange}
						categories={activeCategories}
						onClearFilters={handleClearFilters}
						isLoading={loading}
					/>
				</motion.div>				{/* Products Grid */}
				<motion.div
					className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center mb-8'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.3 }}
				>					{products?.length === 0 && !loading && (
						<div className='col-span-full text-center py-12'>
							<h2 className='text-3xl font-semibold text-gray-300 mb-4'>
								No products found
							</h2>
							<p className='text-gray-400 mb-4'>
								We don't have any products in the "{categoryInfo?.name || category}" category yet.
							</p>
							<motion.button
								onClick={handleClearFilters}
								className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								Clear Filters
							</motion.button>
						</div>
					)}

					{products?.map((product) => (
						<ProductCard key={product._id} product={product} />
					))}

					{loading && (
						<div className="col-span-full flex justify-center py-8">
							<LoadingSpinner />
						</div>
					)}
				</motion.div>				{/* Pagination */}
				{pagination && pagination.totalPages > 1 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.4 }}
					>
						<Pagination
							currentPage={pagination.currentPage || currentPage}
							totalPages={pagination.totalPages}
							totalProducts={pagination.totalProducts}
							limit={pagination.limit}
							onPageChange={handlePageChange}
						/>
					</motion.div>
				)}</div>
		</div>
	);
};

export default CategoryPage;
