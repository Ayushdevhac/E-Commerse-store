import axios from 'axios';

// Determine the API base URL with better Vercel support
let apiUrl;

// First priority: explicit environment variable
if (import.meta.env.VITE_API_URL) {
    apiUrl = import.meta.env.VITE_API_URL;
    console.log('Using VITE_API_URL:', apiUrl);
} else if (typeof window !== 'undefined') {
    // Check if we're on Vercel or other platforms
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
        // For Vercel/Netlify, we need the backend API URL to be explicitly set
        // This should ALWAYS be configured via environment variables in production
        console.error('⚠️ VITE_API_URL not set for production deployment! This will likely cause API failures.');
        console.warn('Please set VITE_API_URL environment variable in your Vercel project settings.');
        apiUrl = '/api'; // Fallback, but this probably won't work
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Local development fallback
        apiUrl = 'http://localhost:5000/api';
        console.log('Using local development API URL:', apiUrl);
    } else {
        // Production fallback - same domain (only works if frontend and backend are on same domain)
        apiUrl = `${protocol}//${hostname}/api`;
        console.log('Using same-domain API URL:', apiUrl);
    }
} else {
    // Fallback for SSR or when window is not available
    apiUrl = '/api';
    console.log('Using SSR fallback API URL:', apiUrl);
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
        if (import.meta.env.MODE === 'development') {
            console.log('🚀 Making request to:', config.baseURL + config.url);
        }
        return config;
    },
    (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
    (response) => {
        if (import.meta.env.MODE === 'development') {
            console.log('✅ Response received:', response.status, response.config.url);
        }
        return response;
    },
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ Request timeout - API server may be slow or unreachable');
        } else if (error.response) {
            console.error('📡 API Response error:', {
                status: error.response.status,
                url: error.config?.url,
                message: error.response.data?.message || 'Unknown error'
            });
        } else if (error.request) {
            console.error('🌐 Network error - Cannot reach API server:', {
                url: error.config?.url,
                baseURL: error.config?.baseURL,
                message: 'Please check your internet connection and API server status'
            });
        } else {
            console.error('⚙️ Request setup error:', error.message);
        }
        return Promise.reject(error);
    }
);

console.log('🔧 Axios configured with baseURL:', apiUrl);

export default axiosInstance;