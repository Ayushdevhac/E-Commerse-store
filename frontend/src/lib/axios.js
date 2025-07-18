import axios from 'axios';

// Determine the API base URL with better Vercel support
let apiUrl;

// First priority: explicit environment variable
if (import.meta.env.VITE_API_URL) {
    apiUrl = import.meta.env.VITE_API_URL;
} else if (typeof window !== 'undefined') {
    // Check if we're on Vercel or other platforms
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
        // For Vercel/Netlify, we need the backend API URL to be explicitly set
        // This should ALWAYS be configured via environment variables in production
        apiUrl = '/api'; // Fallback, but this probably won't work
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Local development fallback
        apiUrl = 'http://localhost:5000/api';
    } else {
        // Production fallback - same domain (only works if frontend and backend are on same domain)
        apiUrl = `${protocol}//${hostname}/api`;
    }
} else {
    // Fallback for SSR or when window is not available
    apiUrl = '/api';
}

const axiosInstance = axios.create({
    baseURL: apiUrl,
    withCredentials: true, // This allows cookies to be sent with requests, useful for authentication
    timeout: 15000, // 15 second timeout for better production experience
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for automatic token refresh and error handling
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors with automatic token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Skip refresh for auth-related endpoints to avoid infinite loops
            if (originalRequest.url?.includes('/auth/refresh-token') || 
                originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/signup')) {
                return Promise.reject(error);
            }
            
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return axiosInstance(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Attempt to refresh the token
                const refreshResponse = await axiosInstance.post('/auth/refresh-token');
                
                if (refreshResponse.data?.message === 'Token refreshed successfully') {
                    processQueue(null);
                    
                    // Retry the original request
                    return axiosInstance(originalRequest);
                } else {
                    throw new Error('Invalid refresh response');
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                
                // Clear user state but don't call logout to avoid more requests
                if (typeof window !== 'undefined') {
                    // Import dynamically to avoid circular dependencies
                    const { useUserStore } = await import('../stores/useUserStore');
                    const store = useUserStore.getState();
                    store.set?.({ user: null, checkingAuth: false });
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Handle other types of errors
        if (error.code === 'ECONNABORTED') {
            // Request timeout - API server may be slow or unreachable
        } else if (error.response) {
            // API Response error
        } else if (error.request) {
            // Network error - Cannot reach API server
        } else {
            // Request setup error
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;