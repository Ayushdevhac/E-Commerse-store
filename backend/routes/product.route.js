import express from 'express';
import { getAllProducts, getFeaturedProducts, createProducts, deleteProducts, getRecommendedProducts, getProductsByCategory, toggleFeaturedProducts } from '../controllers/product.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';

const router = express.Router();
router.get('/', protectRoute, adminRoute, getAllProducts);
router.get('/fetured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/recommendation', getRecommendedProducts);

router.post('/', protectRoute, adminRoute, createProducts);
router.patch('/:id', protectRoute, adminRoute, toggleFeaturedProducts);
router.delete('/:id', protectRoute, adminRoute, deleteProducts);


export default router;
