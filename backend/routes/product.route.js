import express from 'express';
import { 
    getAllProducts, 
    getFeaturedProducts, 
    createProducts, 
    deleteProducts, 
    getRecommendedProducts, 
    getProductsByCategory, 
    toggleFeaturedProducts, 
    getProductById, 
    searchProducts,
    getProductCategories,
    validateProductCreation,
    validateProductId,
    validatePagination
} from '../controllers/product.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { authRateLimit } from '../middleware/rateLimiting.middleware.js';
import rateLimit from 'express-rate-limit';

// Rate limiting for public endpoints
const publicRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased from 100 to 500 requests per window for development
    message: { message: 'Too many requests, please try again later' }
});

const router = express.Router();

// Public routes with rate limiting
router.get('/', publicRateLimit, validatePagination, getAllProducts);
router.get('/featured', publicRateLimit, validatePagination, getFeaturedProducts);
router.get('/search', publicRateLimit, searchProducts);
router.get('/categories', publicRateLimit, getProductCategories);
router.get('/category/:category', publicRateLimit, getProductsByCategory);
router.get('/recommendations', publicRateLimit, getRecommendedProducts);
router.get('/:id', publicRateLimit, validateProductId, getProductById);

// Admin routes with authentication and rate limiting
router.post('/', authRateLimit, protectRoute, adminRoute, validateProductCreation, createProducts);
router.patch('/:id', authRateLimit, protectRoute, adminRoute, validateProductId, toggleFeaturedProducts);
router.delete('/:id', authRateLimit, protectRoute, adminRoute, validateProductId, deleteProducts);

export default router;
