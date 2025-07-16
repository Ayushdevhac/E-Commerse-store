import { create } from "zustand";
import axios from "../lib/axios";
import showToast from "../lib/toast";

export const useCartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,
	getMyCoupon: async () => {
		try {
			console.log('🔍 Fetching user coupon...');
			const response = await axios.get("/coupon");
			console.log('✅ Coupon response:', response.data);
			set({ coupon: response.data });
		} catch (error) {
			console.error("❌ Error fetching coupon:", error.response?.data || error.message);
		}
	},

	applyCoupon: async (code) => {
		try {
			const { subtotal } = get();
			console.log('🔍 Applying coupon:', code, 'with subtotal:', subtotal);
			const response = await axios.post("/coupon/validate", { code, total: subtotal });
			console.log('✅ Coupon validation response:', response.data);
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
			showToast.success("Coupon applied successfully");
		} catch (error) {
			console.error("❌ Error applying coupon:", error.response?.data || error.message);
			showToast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		showToast.success("Coupon removed");
	},
	getCartItems: async () => {
		try {
			const res = await axios.get("/cart");
			set({ cart: res.data });
			get().calculateTotals();
		} catch (error) {
			set({ cart: [] });
			showToast.error(error.response?.data?.message || "An error occurred");
		}
	},	clearCart: async () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
	},
		addToCart: async (product) => {
		try {
			const productData = {
				productId: product._id
			};
			
			// Include size if product has sizes
			if (product.selectedSize) {
				productData.size = product.selectedSize;
			}
			
			await axios.post("/cart", productData);
			showToast.success("Product added to cart");

			set((prevState) => {
				// For products with sizes, consider size in uniqueness check
				const cartKey = product.selectedSize ? `${product._id}-${product.selectedSize}` : product._id;
				const existingItem = prevState.cart.find((item) => {
					const itemKey = item.selectedSize ? `${item._id}-${item.selectedSize}` : item._id;
					return itemKey === cartKey;
				});
				
				const newCart = existingItem
					? prevState.cart.map((item) => {
						const itemKey = item.selectedSize ? `${item._id}-${item.selectedSize}` : item._id;
						return itemKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item;
					})
					: [...prevState.cart, { 
						...product, 
						quantity: 1,
						cartId: cartKey // Add unique cart ID for products with sizes
					}];
				return { cart: newCart };
			});
			get().calculateTotals();
		} catch (error) {
			showToast.error(error.response.data.message || "An error occurred");
		}
	},
	removeFromCart: async (productId) => {
		await axios.delete(`/cart`, { data: { productId } });
		set((prevState) => ({ cart: prevState.cart.filter((item) => item._id !== productId) }));
		get().calculateTotals();
	},
	updateQuantity: async (productId, quantity) => {
		if (quantity === 0) {
			get().removeFromCart(productId);
			return;
		}

		await axios.put(`/cart/${productId}`, { quantity });
		set((prevState) => ({
			cart: prevState.cart.map((item) => (item._id === productId ? { ...item, quantity } : item)),
		}));
		get().calculateTotals();
	},	calculateTotals: () => {
		const { cart, coupon, isCouponApplied } = get();
		const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		let total = subtotal;

		// Check if coupon is applied and still valid
		if (coupon && isCouponApplied) {
			if (subtotal >= coupon.minimumAmount) {
				// Coupon is still valid, apply discount
				const discount = subtotal * (coupon.discountPercentage / 100);
				total = subtotal - discount;
			} else {
				// Cart total fell below minimum amount, remove coupon
				console.log('⚠️ Cart total fell below minimum amount, removing coupon');
				set({ isCouponApplied: false });
				showToast.error(`Cart total must be at least $${coupon.minimumAmount} to use this coupon`);
			}
		}

		set({ subtotal, total });
	},
}));
