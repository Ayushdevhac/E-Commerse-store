import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api", // Use environment variable in production
    withCredentials: true // This allows cookies to be sent with requests, useful for authentication
});

export default axiosInstance;