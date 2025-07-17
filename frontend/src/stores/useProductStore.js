import { create } from "zustand";
import showToast from "../lib/toast";
import axios from "../lib/axios";

export const useProductStore = create((set, get) => ({
	products: [],
	loading: false,
	error: null,
	productType: null, // Track what type of products are loaded: 'all', 'featured', 'category'
	pagination: {
		currentPage: 1,
		totalPages: 1,
		totalProducts: 0,
		limit: 12,
		hasNextPage: false,
		hasPrevPage: false
	},	filters: {
		category: null,
		minPrice: null,
		maxPrice: null,
		search: '',		sort: '-createdAt'
	},

	setProducts: (products) => set({ products }),
	clearProducts: () => set({ 
		products: [], 
		error: null, 
		productType: null,
		pagination: {
			currentPage: 1,
			totalPages: 1,
			totalProducts: 0,
			limit: 12,
			hasNextPage: false,
			hasPrevPage: false
		}
		// Note: We don't clear filters here to allow state persistence
	}),

	setFilters: (newFilters) => set((state) => ({
		filters: { ...state.filters, ...newFilters }
	})),

	clearFilters: () => set({
		filters: {
			category: null,
			minPrice: null,
			maxPrice: null,
			search: '',
			sort: '-createdAt'
		}
	}),

	setPagination: (pagination) => set({ pagination }),

	createProduct: async (productData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/products", productData);
			set((state) => ({
				products: [...(state?.products), res.data],
				loading: false,
			}));
			showToast.success("Product created successfully");
		} catch (error) {
			const errorMessage = error?.response?.data?.message || "Failed to create product";
			showToast.error(errorMessage);
			set({ loading: false });
		}
	},

	// Enhanced fetchAllProducts with pagination and filtering
	fetchAllProducts: async (page = 1, filters = {}) => {
		set({ loading: true, products: [] });
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: get().pagination.limit.toString(),
				...filters
			});

			const response = await axios.get(`/products?${params}`);
			
			set({ 
				products: response.data.products, 
				loading: false, 
				productType: 'all',
				pagination: response.data.pagination,
				filters: response.data.filters
			});
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			showToast.error(error.response?.data?.message || "Failed to fetch products");
		}
	},	// Enhanced fetchProductsByCategory with pagination and filters
	fetchProductsByCategory: async (category, page = 1, options = {}) => {
		set({ loading: true, error: null, products: [] });
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: options.limit || get().pagination.limit.toString(),
				sort: options.sort || get().filters.sort
			});

			// Add price filters if provided and valid
			if (options.minPrice !== undefined && options.minPrice !== null && options.minPrice > 0) {
				params.append('minPrice', options.minPrice.toString());
			}
			if (options.maxPrice !== undefined && options.maxPrice !== null && options.maxPrice > 0) {
				params.append('maxPrice', options.maxPrice.toString());
			}
			if (options.search && options.search.trim()) {
				params.append('search', options.search.trim());
			}

			const response = await axios.get(`/products/category/${category}?${params}`);
			
			set({ 
				products: response.data.products, 
				loading: false, 
				productType: 'category',
				pagination: response.data.pagination,
				filters: { 
					...get().filters, 
					...response.data.filters,
					// Preserve the actual filter values that were applied
					minPrice: options.minPrice || null,
					maxPrice: options.maxPrice || null,
					search: options.search || ''
				}
			});
		} catch (error) {
			console.error("Error fetching products by category:", error);
			set({ error: "Failed to fetch products", loading: false });
			showToast.error(error.response?.data?.message || "Failed to fetch products");
		}
	},

	// Enhanced search products with pagination
	searchProducts: async (query, page = 1, options = {}) => {
		if (!query.trim()) {
			get().fetchAllProducts(page);
			return;
		}

		set({ loading: true, products: [] });
		try {
			const params = new URLSearchParams({
				q: query,
				page: page.toString(),
				limit: options.limit || get().pagination.limit.toString(),
				sort: options.sort || get().filters.sort
			});

			const response = await axios.get(`/products/search?${params}`);
			
			set({ 
				products: response.data.products, 
				loading: false, 
				productType: 'search',
				pagination: response.data.pagination,
				filters: { ...get().filters, search: query }
			});
		} catch (error) {
			set({ error: "Failed to search products", loading: false });
			showToast.error(error.response?.data?.message || "Failed to search products");		}
	},

	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axios.delete(`/products/${productId}`);
			set((state) => ({
				products: state.products.filter((product) => product._id !== productId),
				loading: false,
			}));
			showToast.success("Product deleted successfully");
		} catch (error) {
			set({ loading: false });
			showToast.error(error.response?.data?.message || "Failed to delete product");
		}
	},

	toggleFeaturedProduct: async (productId) => {
		set({ loading: true });
		try {
			const response = await axios.patch(`/products/${productId}`);
			
			set((state) => ({
				products: state.products.map((product) =>
					product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
				),
				loading: false,
			}));
			
			const statusText = response.data.isFeatured ? "featured" : "removed from featured";
			showToast.success(`Product ${statusText} successfully`);
			
			// Refresh featured products if currently showing them
			const currentState = get();
			if (currentState.productType === 'featured') {
				setTimeout(() => {
					get().fetchFeaturedProducts();
				}, 200);
			}
			
		} catch (error) {
			set({ loading: false });
			showToast.error(error.response?.data?.message || "Failed to update product");
		}
	},
	fetchFeaturedProducts: async () => {
		set({ loading: true, error: null });
		try {
			const response = await axios.get("/products/featured");
			set({ 
				products: response.data || [], 
				loading: false, 
				productType: 'featured',
				error: null,
				// Reset pagination for featured products since they're not paginated
				pagination: {
					currentPage: 1,
					totalPages: 1,
					totalProducts: (response.data || []).length,
					limit: (response.data || []).length,
					hasNextPage: false,
					hasPrevPage: false
				}
			});
		} catch (error) {
			console.error("Error fetching featured products:", error);
			
			if (error.response?.status === 404) {
				// No featured products found - this is normal, not an error
				set({ 
					products: [], 
					loading: false, 
					error: null, 
					productType: 'featured',
					pagination: {
						currentPage: 1,
						totalPages: 1,
						totalProducts: 0,
						limit: 0,
						hasNextPage: false,
						hasPrevPage: false
					}
				});
				console.info("No featured products available at this time");
			} else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
				// Network error - set empty state but don't show error toast
				set({ 
					products: [], 
					loading: false, 
					error: "Unable to connect to server", 
					productType: 'featured',
					pagination: {
						currentPage: 1,
						totalPages: 1,
						totalProducts: 0,
						limit: 0,
						hasNextPage: false,
						hasPrevPage: false
					}
				});
				console.warn("Network error when fetching featured products - displaying empty state");
			} else {
				// Other errors
				set({ 
					products: [], 
					loading: false, 
					error: "Failed to fetch featured products", 
					productType: 'featured',
					pagination: {
						currentPage: 1,
						totalPages: 1,
						totalProducts: 0,
						limit: 0,
						hasNextPage: false,
						hasPrevPage: false
					}
				});
				// Only show toast for unexpected errors
				if (error.response?.status !== 503) { // Don't show toast for service unavailable
					showToast.error(error.response?.data?.message || "Failed to fetch featured products");
				}
			}
		}
	},

	// Fetch product categories for filtering (from product aggregation)
	fetchProductCategories: async () => {
		try {
			const response = await axios.get('/products/categories');
			return response.data;
		} catch (error) {
			console.error('Error fetching product categories:', error);
			return [];
		}
	},
}));
