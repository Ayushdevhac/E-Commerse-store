import { create } from "zustand";
import axios from "../lib/axios";
import showToast from "../lib/toast";
import { validateQuantity, getAvailableStock } from "../lib/stockValidation";

export const useCartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,
	quantityUpdateTimers: new Map(),
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
	},	addToCart: async (product, quantity = 1) => {
		try {
			// Validate quantity and stock using utility function
			const validation = validateQuantity(product, product.selectedSize, quantity);
			if (!validation.isValid) {
				showToast.error(validation.message);
				return;
			}

			const productData = {
				productId: product._id,
				quantity: quantity
			};
			
			// Include size if product has sizes
			if (product.selectedSize) {
				productData.size = product.selectedSize;
			}
			
			const response = await axios.post("/cart", productData);
			showToast.success(`Added ${quantity} item(s) to cart${product.selectedSize ? ` (Size: ${product.selectedSize})` : ''}`);

			// Refresh cart from server to get accurate state
			get().getCartItems();
		} catch (error) {
			const errorMessage = error.response?.data?.message || "Failed to add item to cart";
			showToast.error(errorMessage);
		}
	},removeFromCart: async (productId) => {
		try {
			// Optimistically remove from UI first
			set((prevState) => ({
				cart: prevState.cart.filter((item) => {
					const itemKey = item.cartId || item._id;
					return itemKey !== productId;
				})
			}));
			get().calculateTotals();
			
			// Then sync with backend
			await axios.delete(`/cart`, { data: { productId } });
			showToast.success("Item removed from cart");
		} catch (error) {
			console.error('Error removing item from cart:', error);
			
			// If error occurs, refresh cart to get accurate state
			get().getCartItems();
			
			// Only show error for non-404 errors (404 means item wasn't in cart anyway)
			if (error.response?.status !== 404) {
				showToast.error(error.response?.data?.message || "Failed to remove item from cart");
			}
		}
	},	updateQuantityOptimistic: (productId, newQuantity) => {
		// For instant UI updates with stock validation
		set((prevState) => ({
			cart: prevState.cart.map((item) => {
				if (item.cartId === productId || item._id === productId) {
					// Use shared validation utility
					const validation = validateQuantity(item, item.selectedSize, newQuantity);
					let finalQuantity = newQuantity;
					
					if (!validation.isValid) {
						// If validation fails, try to get the maximum available quantity
						const availableStock = getAvailableStock(item, item.selectedSize);
						finalQuantity = Math.min(newQuantity, availableStock);
						finalQuantity = Math.max(finalQuantity, 1); // Minimum 1
						
						// Show warning if we had to adjust the quantity
						if (finalQuantity !== newQuantity) {
							showToast.warning(`Adjusted quantity to ${finalQuantity} (max available: ${availableStock})`);
						}
					}
					
					return { ...item, quantity: finalQuantity };
				}
				return item;
			}),
		}));
		get().calculateTotals();
		
		// Get the actual final quantity after stock validation
		const updatedItem = get().cart.find(item => 
			item.cartId === productId || item._id === productId
		);
		
		if (updatedItem) {
			get().updateQuantity(productId, updatedItem.quantity);
		}
	},	updateQuantity: async (productId, quantity) => {
		if (quantity === 0) {
			get().removeFromCart(productId);
			return;
		}

		// Find the item to validate against
		const item = get().cart.find(item => 
			item.cartId === productId || item._id === productId
		);
		
		if (!item) {
			showToast.error("Item not found in cart");
			return;
		}

		// Validate quantity using shared utility
		const validation = validateQuantity(item, item.selectedSize, quantity);
		let finalQuantity = quantity;
		
		if (!validation.isValid) {
			const availableStock = getAvailableStock(item, item.selectedSize);
			finalQuantity = Math.min(quantity, availableStock);
			finalQuantity = Math.max(finalQuantity, 1); // Minimum 1
			
			if (finalQuantity !== quantity) {
				showToast.warning(`Adjusted quantity to ${finalQuantity} (max available: ${availableStock})`);
			}
		}

		// Immediately update the UI for instant feedback
		set((prevState) => ({
			cart: prevState.cart.map((item) => {
				if (item.cartId === productId || item._id === productId) {
					return { ...item, quantity: finalQuantity };
				}
				return item;
			}),
		}));
		get().calculateTotals();

		// Clear any existing timer for this product
		const timers = get().quantityUpdateTimers;
		if (timers.has(productId)) {
			clearTimeout(timers.get(productId));
		}

		// Set a new timer to debounce the API call
		const timer = setTimeout(async () => {
			try {
				await axios.put(`/cart/${productId}`, { quantity: finalQuantity });
				timers.delete(productId);
			} catch (error) {
				// If API call fails, show error and refresh cart
				console.error('Failed to update quantity on server:', error);
				const errorMessage = error.response?.data?.message || 'Failed to update quantity';
				showToast.error(errorMessage);
				
				// Refresh cart from server to get accurate state
				get().getCartItems();
			}
		}, 500); // 500ms debounce

		timers.set(productId, timer);
		set({ quantityUpdateTimers: timers });
	},calculateTotals: () => {
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
