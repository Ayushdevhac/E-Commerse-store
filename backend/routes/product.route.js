import express from 'express';
import { getAllProducts, getFeaturedProducts, createProducts, deleteProducts, getRecommendedProducts, getProductsByCategory, toggleFeaturedProducts, getProductById, searchProducts } from '../controllers/product.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';

const router = express.Router();
router.get('/', protectRoute, adminRoute, getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/recommendations', getRecommendedProducts);
router.get('/:id', getProductById);

router.post('/', protectRoute, adminRoute, createProducts);
router.patch('/:id', protectRoute, adminRoute, toggleFeaturedProducts);
router.delete('/:id', protectRoute, adminRoute, deleteProducts);

export default router;
