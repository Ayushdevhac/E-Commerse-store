import Category from "../models/category.model.js";
import { client as redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

// Get all categories
export const getCategories = async (req, res) => {
    try {
        const { page = 1, limit = 20, active } = req.query;
        const skip = (page - 1) * limit;
        
        // Build filter object
        const filter = {};
        if (active !== undefined) {
            filter.isActive = active === 'true';
        }
        
        const categories = await Category.find(filter)
            .sort({ name: 1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Category.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        
        res.json({
            categories,
            currentPage: parseInt(page),
            totalPages,
            totalCategories: total,
            hasNext: page < totalPages,
            hasPrev: page > 1
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get category by ID or slug
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        let category = null;
        
        // Check if the id is a valid ObjectId format
        const mongoose = await import('mongoose');
        if (mongoose.default.Types.ObjectId.isValid(id)) {
            // Try to find by ID first if it's a valid ObjectId
            category = await Category.findById(id);
        }
        
        // If not found by ID or invalid ObjectId, try to find by slug
        if (!category) {
            category = await Category.findOne({ slug: id });
        }
        
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        
        res.json(category);
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Create new category
export const createCategory = async (req, res) => {
    try {
        const { name, description, image, isActive } = req.body;
        
        // Check if category already exists
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });
        
        if (existingCategory) {
            return res.status(400).json({ message: "Category already exists" });
        }

        let finalImageUrl = image;
        
        // If image is base64, upload to Cloudinary
        if (image && image.startsWith('data:image/')) {
            try {
                const cloudinaryResponse = await cloudinary.uploader.upload(image, {
                    folder: 'categories',
                    resource_type: 'image',
                    quality: 'auto',
                    fetch_format: 'auto',
                    transformation: [
                        { width: 400, height: 400, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                });
                finalImageUrl = cloudinaryResponse.secure_url;
            } catch (error) {
                console.error('Cloudinary upload error:', error);
                return res.status(500).json({ message: 'Image upload failed' });
            }
        }
        
        const category = new Category({
            name: name.trim(),
            description: description ? description.trim() : '',
            image: finalImageUrl,
            isActive: isActive !== undefined ? isActive : true
        });
        
        await category.save();
        
        // Clear categories cache
        try {
            await redis.del("categories:all");
            await redis.del("categories:active");
        } catch (redisError) {
            console.warn("Redis cache clear error:", redisError);
        }
        
        res.status(201).json({
            message: "Category created successfully",
            category
        });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image, isActive } = req.body;
        
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        
        // Check if new name conflicts with existing category
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ 
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: id }
            });
            
            if (existingCategory) {
                return res.status(400).json({ message: "Category name already exists" });
            }
        }

        let finalImageUrl = image;
        
        // If image is base64, upload to Cloudinary
        if (image && image.startsWith('data:image/')) {
            try {
                // Delete old image from Cloudinary if it exists
                if (category.image && category.image.includes('cloudinary.com')) {
                    const publicId = category.image.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`categories/${publicId}`);
                }
                
                const cloudinaryResponse = await cloudinary.uploader.upload(image, {
                    folder: 'categories',
                    resource_type: 'image',
                    quality: 'auto',
                    fetch_format: 'auto',
                    transformation: [
                        { width: 400, height: 400, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                });
                finalImageUrl = cloudinaryResponse.secure_url;
            } catch (error) {
                console.error('Cloudinary upload error:', error);
                return res.status(500).json({ message: 'Image upload failed' });
            }
        }
        
        // Update fields
        if (name) category.name = name.trim();
        if (description !== undefined) category.description = description ? description.trim() : '';
        if (image !== undefined) category.image = finalImageUrl;
        if (isActive !== undefined) category.isActive = isActive;
        
        // Regenerate slug if name changed
        if (name) {
            category.slug = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        }
        
        await category.save();
        
        // Clear categories cache
        try {
            await redis.del("categories:all");
            await redis.del("categories:active");
        } catch (redisError) {
            console.warn("Redis cache clear error:", redisError);
        }
        
        res.json({
            message: "Category updated successfully",
            category
        });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        
        // Delete category image from cloudinary if exists
        if (category.image) {
            try {
                const imageId = category.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(`categories/${imageId}`);
            } catch (error) {
                console.error("Error deleting image from cloudinary:", error);
            }
        }
        
        await Category.findByIdAndDelete(id);
        
        // Clear categories cache
        try {
            await redis.del("categories:all");
            await redis.del("categories:active");
        } catch (redisError) {
            console.warn("Redis cache clear error:", redisError);
        }
        
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Toggle category status
export const toggleCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
          category.isActive = !category.isActive;
        await category.save();
        
        // Clear categories cache
        try {
            await redis.del("categories:all");
            await redis.del("categories:active");
        } catch (redisError) {
            console.warn("Redis cache clear error:", redisError);
        }
        
        res.json({
            message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
            category
        });
    } catch (error) {
        console.error("Error toggling category status:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get active categories for public use
export const getActiveCategories = async (req, res) => {
    try {
        // Try to get from cache first
        let cachedCategories;
        try {
            cachedCategories = await redis.get("categories:active");
        } catch (redisError) {
            console.warn("Redis error, skipping cache:", redisError);
        }
        
        if (cachedCategories) {
            return res.json(JSON.parse(cachedCategories));
        }
        
        const categories = await Category.find({ isActive: true })
            .sort({ name: 1 })
            .select('name description image slug');
        
        // Cache for 1 hour
        try {
            await redis.setEx("categories:active", 3600, JSON.stringify(categories));
        } catch (redisError) {
            console.warn("Redis cache set error:", redisError);
        }
        
        res.json(categories);
    } catch (error) {
        console.error("Error fetching active categories:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
