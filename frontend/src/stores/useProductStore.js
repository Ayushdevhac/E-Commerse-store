import { create } from "zustand";
import showToast from "../lib/toast";
import axios from "../lib/axios";

export const useProductStore = create((set, get) => ({
	products: [],
	loading: false,
	error: null,
	productType: null, // Track what type of products are loaded: 'all', 'featured', 'category'

	setProducts: (products) => set({ products }),
	clearProducts: () => set({ products: [], error: null, productType: null }),
	createProduct: async (productData) => {
		set({ loading: true });		try {
			const res = await axios.post("/products", productData);
        
			set((state) => ({
				products: [...(state?.products), res.data],
				loading: false,
			}));
			showToast.success("Product created successfully");
		} catch (error) {
			const errorMessage = error?.response?.data?.error || "Failed to create product";
			showToast.error(errorMessage);
			set({ loading: false });
		}
	},	fetchAllProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products");
			
			set({ products: response.data, loading: false, productType: 'all' });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			showToast.error(error.response.data.error || "Failed to fetch products");
		}
	},	fetchProductsByCategory: async (category) => {
		set({ loading: true, products: [], error: null }); // Clear previous products
		try {
			const response = await axios.get(`/products/category/${category}`);
			set({ products: response.data.products, loading: false, productType: 'category' });
		} catch (error) {
			console.error("Error fetching products by category:", error);
			set({ error: "Failed to fetch products", loading: false });
			showToast.error(error.response.data.error || "Failed to fetch products");
		}
	},
	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axios.delete(`/products/${productId}`);
			set((state) => ({
				products: state.products.filter((product) => product._id !== productId),
				loading: false,
			}));		} catch (error) {
			set({ loading: false });
			showToast.error(error.response.data.error || "Failed to delete product");
		}
	},	toggleFeaturedProduct: async (productId) => {
		set({ loading: true });
		try {
			const response = await axios.patch(`/products/${productId}`);
			// this will update the isFeatured prop of the product
			set((state) => ({
				products: state.products.map((product) =>
					product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
				),
				loading: false,
			}));
			
			// Show appropriate message
			const statusText = response.data.isFeatured ? "featured" : "removed from featured";
			showToast.success(`Product ${statusText} successfully`);
			
			// If we're currently showing featured products, refresh them
			const currentState = get();
			if (currentState.productType === 'featured') {
				// Delay slightly to ensure backend cache is updated
				setTimeout(() => {
					get().fetchFeaturedProducts();
				}, 200);
			}
			
		} catch (error) {
			set({ loading: false });
			showToast.error(error.response.data.error || "Failed to update product");
		}
	},fetchFeaturedProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products/featured");
			set({ products: response.data, loading: false, productType: 'featured' });
		} catch (error) {
			// If 404, it means no featured products exist - clear the products array
			if (error.response?.status === 404) {
				set({ products: [], loading: false, error: null, productType: 'featured' });
				console.log("No featured products found - clearing products list");
			} else {
				set({ error: "Failed to fetch products", loading: false });
				console.log("Error fetching featured products:", error);
			}
		}
	},
}));
