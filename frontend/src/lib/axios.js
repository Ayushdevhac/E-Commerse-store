import axios from 'axios';
const axiosInstance = axios.create({
    baseURL: "/api", // Use the proxy in development, direct path in production
    withCredentials: true // This allows cookies to be sent with requests, useful for authentication
});
  
  

  export default axiosInstance;