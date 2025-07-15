import express from "express";
import { body } from "express-validator";
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    getActiveCategories
} from "../controllers/category.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";

const router = express.Router();

// Validation rules
const categoryValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Category name must be between 1 and 50 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Description cannot exceed 200 characters'),
    body('image')
        .optional()
        .custom((value) => {
            if (!value) return true; // Allow empty/undefined
            // Allow URLs or base64 images
            if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image/')) {
                return true;
            }
            throw new Error('Image must be a valid URL or base64 image');
        }),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
];

// Public routes
router.get("/active", getActiveCategories);
router.get("/:id", getCategoryById);

// Protected routes (admin only)
router.get("/", protectRoute, adminRoute, getCategories);
router.post("/", protectRoute, adminRoute, categoryValidation, validateRequest, createCategory);
router.put("/:id", protectRoute, adminRoute, categoryValidation, validateRequest, updateCategory);
router.delete("/:id", protectRoute, adminRoute, deleteCategory);
router.patch("/:id/toggle", protectRoute, adminRoute, toggleCategoryStatus);

export default router;
