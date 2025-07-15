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
import { protectRoute, adminRoute, authRateLimit } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

// Rate limiting for public endpoints
const publicRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { message: 'Too many requests, please try again later' }
});

const router = express.Router();

// Public routes with rate limiting
router.get('/', publicRateLimit, validatePagination, getAllProducts);
router.get('/featured', publicRateLimit, getFeaturedProducts);
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
