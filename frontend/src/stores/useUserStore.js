import { create } from "zustand";
import axios from "../lib/axios";
import showToast from "../lib/toast";

export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,
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
		set({ checkingAuth: true });
		try {
			const response = await axios.get("/auth/profile");
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			console.log(error.message);
			set({ checkingAuth: false, user: null });
		}
	},	refreshToken: async () => {
		// Prevent multiple simultaneous refresh attempts
		if (get().checkingAuth) return;

		set({ checkingAuth: true });
		try {
			console.log('🔄 Attempting to refresh access token...');
			const response = await axios.post("/auth/refresh-token");
			set({ checkingAuth: false });
			
			console.log('✅ Refresh token response:', response.data);
			
			// Validate that we got a success response
			if (response.data?.message === 'Token refreshed successfully') {
				console.log('🎉 Access token refreshed successfully');
				return response.data;
			} else {
				throw new Error('Invalid refresh response');
			}
		} catch (error) {
			console.error('❌ Token refresh failed:', error.response?.data?.message || error.message);
			
			// Check for specific error codes
			if (error.response?.data?.code === 'TOKEN_NOT_STORED') {
				console.log('💡 User needs to log in again - refresh token not found in Redis');
			} else if (error.response?.data?.code === 'TOKEN_MISMATCH') {
				console.log('💡 User needs to log in again - refresh token mismatch');
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

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		
		// Only attempt refresh for 401 errors and avoid infinite loops
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					refreshPromise = null;
					return axios(originalRequest);
				}				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				// Retry the original request
				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, clear promise and redirect to login
				refreshPromise = null;
				console.error('❌ Token refresh failed, logging out user');
				
				// Only logout if we're not already logged out
				const currentUser = useUserStore.getState().user;
				if (currentUser) {
					await useUserStore.getState().logout();
				}
				
				// Redirect to login page
				if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
					window.location.href = '/login';
				}
				
				return Promise.reject(refreshError);
			}
		}
		
		return Promise.reject(error);
	}
);
