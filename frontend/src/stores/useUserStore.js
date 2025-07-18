import { create } from "zustand";
import axios from "../lib/axios";
import showToast from "../lib/toast";

export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: false, // Start as false to allow initial auth check
	lastAuthCheck: null, // Track when we last checked auth
	signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			return showToast.error("Passwords do not match");
		}
		try {
			const res = await axios.post("/auth/signup", { name, email, password });
			set({ user: res.data.user, loading: false });
		} catch (error) {
			set({ loading: false });
			showToast.error(error.response.data.message || "An error occurred");
		}
	},	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axios.post("/auth/login", { email, password });
			// Ensure the user state is properly set with all properties
			const userData = res.data.user;
			set({ 
				user: {
					...userData,
					role: userData.role // Explicitly ensure role is set
				}, 
				loading: false 
			});
		} catch (error) {
			set({ loading: false });
			showToast.error(error.response.data.message || "An error occurred");
		}
	},	logout: async () => {
		try {
			await axios.post("/auth/logout");
			set({ user: null });
			
			// Clear other stores on logout
			if (typeof window !== 'undefined') {
				const { useAddressStore } = await import('./useAddressStore');
				useAddressStore.getState().clearAddresses();
			}
		} catch (error) {
			showToast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

	checkAuth: async () => {
		// Prevent multiple simultaneous checkAuth calls
		const currentState = get();
		if (currentState.checkingAuth) {
			return;
		}

		// Debounce: Don't check auth if we checked recently (within 5 seconds)
		const now = Date.now();
		if (currentState.lastAuthCheck && (now - currentState.lastAuthCheck) < 5000) {
			return;
		}

		// Check if there's any indication that the user was previously logged in
		let hasVisibleTokens = false;
		if (typeof document !== 'undefined') {
			const cookieArray = document.cookie.split('; ').filter(c => c.length > 0);
			const hasRefreshCookie = cookieArray.some(c => c.startsWith('refreshToken='));
			const hasAccessCookie = cookieArray.some(c => c.startsWith('accessToken='));
			hasVisibleTokens = hasRefreshCookie || hasAccessCookie;
		}

		// Set checking state and timestamp
		set({ checkingAuth: true, lastAuthCheck: now });

		// Add a timeout to ensure checkingAuth doesn't stay true forever
		const timeoutId = setTimeout(() => {
			const currentState = get();
			if (currentState.checkingAuth) {
				set({ checkingAuth: false, user: null });
			}
		}, 10000); // 10 second timeout

		try {
			// Try to get profile first - this will work if access token is valid
			// or if httpOnly cookies are present and valid
			const response = await axios.get("/auth/profile");
			clearTimeout(timeoutId);
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			// If we get a 401, try to refresh the token
			if (error.response?.status === 401) {
				try {
					// Try to refresh the token - this works with both visible and httpOnly cookies
					const refreshResponse = await axios.post("/auth/refresh-token");
					
					if (refreshResponse.data?.message === 'Token refreshed successfully') {
						// After successful refresh, try to get profile again
						const profileResponse = await axios.get("/auth/profile");
						clearTimeout(timeoutId);
						set({ user: profileResponse.data, checkingAuth: false });
					} else {
						throw new Error('Invalid refresh response');
					}
				} catch (refreshError) {
					// Refresh failed - user needs to login again
					clearTimeout(timeoutId);
					set({ checkingAuth: false, user: null });
				}
			} else {
				// Not a 401, just set as not authenticated
				clearTimeout(timeoutId);
				set({ checkingAuth: false, user: null });
			}
		}
	},	refreshToken: async () => {
		const currentState = get();
		// Prevent multiple simultaneous refresh attempts
		if (currentState.checkingAuth) {
			throw new Error('Already refreshing token');
		}

		set({ checkingAuth: true });
		try {
			const response = await axios.post("/auth/refresh-token");
			set({ checkingAuth: false });
			
			// Validate that we got a success response
			if (response.data?.message === 'Token refreshed successfully') {
				return response.data;
			} else {
				throw new Error('Invalid refresh response');
			}
		} catch (error) {
			// Check for specific error codes
			if (error.response?.data?.code === 'TOKEN_NOT_STORED') {
				// User needs to log in again - refresh token not found in Redis
			} else if (error.response?.data?.code === 'TOKEN_MISMATCH') {
				// User needs to log in again - refresh token mismatch
			}
			
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},

	updateProfile: async (profileData) => {
		try {
			const currentUser = get().user;
			if (!currentUser) return;

			// Update the user state immediately for better UX
			set({ 
				user: { 
					...currentUser, 
					...profileData 
				} 
			});
		} catch (error) {
			console.error("Error updating profile in store:", error);
		}
	},
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptors (refresh logic implemented in ../lib/axios.js)
