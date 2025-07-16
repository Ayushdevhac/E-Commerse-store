import { client } from '../lib/redis.js';
import { ensureRedisConnection } from '../lib/redis.js';
import { ensureDBConnection } from '../lib/db.js';
import cloudinary from '../lib/cloudinary.js';
import Product from '../models/product.model.js';
import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Validation rules
export const validateProductCreation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Product name must be between 2 and 100 characters')
        .escape(),
    body('price')
        .isFloat({ min: 0.01, max: 999999 })
        .withMessage('Price must be between 0.01 and 999999'),
    body('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters')
        .escape(),
    body('category')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Category must be between 2 and 50 characters')
        .escape(),
    body('image')
        .notEmpty()
        .withMessage('Image is required'),
    body('sizes')
        .optional()
        .isArray()
        .withMessage('Sizes must be an array'),
    body('sizes.*')
        .optional()
        .isString()
        .withMessage('Each size must be a string'),
    body('stock')
        .optional()
        .custom((value, { req }) => {
            if (req.body.sizes && req.body.sizes.length > 0) {
                // If sizes are provided, stock should be an object with size keys
                if (typeof value !== 'object') {
                    throw new Error('Stock must be an object when sizes are specified');
                }
                for (let size of req.body.sizes) {
                    if (!value[size] || value[size] < 0) {
                        throw new Error(`Stock for size ${size} must be specified and non-negative`);
                    }
                }
            } else {
                // If no sizes, stock can be a simple number
                if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
                    throw new Error('Stock must be a non-negative integer');
                }
            }
            return true;
        })
];

export const validateProductId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid product ID format')
];

export const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Page must be between 1 and 1000'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('sort')
        .optional()
        .isIn(['price', 'name', 'createdAt', '-price', '-name', '-createdAt'])
        .withMessage('Invalid sort field')
];

// Enhanced getAllProducts with pagination, filtering, and sorting
export const getAllProducts = async (req, res) => {
    try {
        // Ensure database connection before any DB operations
        console.log('Ensuring DB connection for getAllProducts...');
        await ensureDBConnection();
        
        // Verify connection state
        console.log('DB connection state:', mongoose.connection.readyState);
        console.log('DB connection host:', mongoose.connection.host);
        
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 12, 100); // Max 100 items per page
        const skip = (page - 1) * limit;
        const sort = req.query.sort || '-createdAt';
        const categoryRaw = req.query.category;
        const minPriceRaw = req.query.minPrice;
        const maxPriceRaw = req.query.maxPrice;
        const search = req.query.search;

        // Build filter object
        const filter = {};
        if (minPriceRaw !== undefined) {
            const min = parseFloat(minPriceRaw);
            if (!isNaN(min)) filter.price = { ...(filter.price || {}), $gte: min };
        }
        if (maxPriceRaw !== undefined) {
            const max = parseFloat(maxPriceRaw);
            if (!isNaN(max)) filter.price = { ...(filter.price || {}), $lte: max };
        }
        if (categoryRaw && categoryRaw !== 'all') {
            const cat = categoryRaw.trim();
            filter.category = new RegExp(`^${cat}$`, 'i');
        }
        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { category: new RegExp(search, 'i') }
            ];
        }

        // Execute queries in parallel
        const [products, totalProducts] = await Promise.all([
            Product.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalProducts / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            products,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
                limit,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null
            },
            filters: {
                category: categoryRaw,
                minPrice: minPriceRaw,
                maxPrice: maxPriceRaw,
                search,
                sort
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getFeaturedProducts = async (_req, res) => {
    try {
        // Ensure Redis connection is available
        const isConnected = await ensureRedisConnection();
        
        if (isConnected) {
            let featuredProducts = await client.get('featuredProducts');
            
            if (featuredProducts) {
                featuredProducts = JSON.parse(featuredProducts);
                return res.status(200).json(featuredProducts);
            }
        }
        
        // If Redis is not available or no cached data, fetch from database
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        if (!featuredProducts || featuredProducts.length === 0) {
            return res.status(404).json({ message: 'No featured products found' });
        }
        
        // Cache the result if Redis is available
        if (isConnected) {
            try {
                await client.set('featuredProducts', JSON.stringify(featuredProducts));
            } catch (cacheError) {
                console.warn('Failed to cache featured products:', cacheError.message);
            }
        }
        
        res.status(200).json(featuredProducts);
    } catch (error) {
        console.error('Error fetching featured products:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}
// Enhanced createProducts with better validation and security
export const createProducts = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation error',
                errors: errors.array()
            });
        }        const { name, price, description, image, category, sizes, stock } = req.body;

        // Convert price to number and validate
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            return res.status(400).json({ message: 'Invalid price value' });
        }        // Process sizes and stock        
        let processedSizes = [];
        let processedStock;
        
        if (sizes && sizes.length > 0) {
            // Validate and process sizes
            const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
            processedSizes = sizes.map(size => size.toString().toUpperCase()).filter(size => validSizes.includes(size));
            
            // Process stock for each size (Map for sized products)
            processedStock = new Map();
            if (stock && typeof stock === 'object') {
                for (let size of processedSizes) {
                    const stockValue = parseInt(stock[size]) || 0;
                    processedStock.set(size, Math.max(0, stockValue));
                }
            } else {
                // Default stock if not provided
                for (let size of processedSizes) {
                    processedStock.set(size, 10); // Default stock of 10 per size
                }
            }
        } else {
            // Simple stock for products without sizes (Number)
            processedStock = stock && typeof stock === 'number' ? Math.max(0, parseInt(stock)) : 10;
        }

        let cloudinaryResponse;
        try {
            // Validate image format and size before upload
            if (!image.startsWith('data:image/')) {
                return res.status(400).json({ message: 'Invalid image format' });
            }

            cloudinaryResponse = await cloudinary.uploader.upload(image, {
                folder: 'products',
                resource_type: 'image',
                quality: 'auto',
                fetch_format: 'auto',
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto' }
                ]
            });
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ message: 'Image upload failed' });
        }

        const productData = {
            name: name.trim(),
            price: priceNum,
            description: description.trim(),
            image: cloudinaryResponse.secure_url,
            category: category.toLowerCase().trim()
        };        // Add sizes and stock if provided
        if (processedSizes.length > 0) {
            productData.sizes = processedSizes;
            productData.stock = processedStock;
        } else if (processedStock.has && processedStock.has('default')) {
            productData.stock = processedStock;
        } else {
            productData.stock = processedStock;
        }

        const product = await Product.create(productData);

        // Clear relevant caches
        await Promise.all([
            updateFreaturedProductsCache(),
            clearProductCaches()
        ]);

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};



// Enhanced deleteProducts with better security
export const deleteProducts = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Delete image from Cloudinary if it exists
        if (product.image) {
            try {
                // Extract public_id from Cloudinary URL
                const publicId = product.image.split('/').slice(-2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId);
                console.log('Image deleted from Cloudinary');
            } catch (error) {
                console.error('Error deleting image from Cloudinary:', error.message);
                // Continue with product deletion even if image deletion fails
            }
        }
        
        // Delete the product from database
        await Product.findByIdAndDelete(id);
        
        // Clear caches
        await Promise.all([
            updateFreaturedProductsCache(),
            clearProductCaches()
        ]);
        
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getRecommendedProducts = async (_req, res) => {
    try {
        // First check if there are any products
        const totalProducts = await Product.countDocuments();
        
        if (totalProducts === 0) {
            return res.status(200).json([]);
        }
        
        // If there are fewer than 3 products, get all of them
        const sampleSize = Math.min(3, totalProducts);
        
        const products = await Product.aggregate([
            {
                $sample: { size: sampleSize }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    price: 1,
                    description: 1,
                    image: 1,
                    category: 1
                }
            }
        ]);
        
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching recommended products:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}// Enhanced getProductById with better validation
export const getProductById = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation error',
                errors: errors.array()
            });
        }

        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }

        const product = await Product.findById(id).lean();
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Enhanced getProductsByCategory with pagination and filters
export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 12, 100);
        const skip = (page - 1) * limit;
        const sort = req.query.sort || '-createdAt';
        const minPriceRaw = req.query.minPrice;
        const maxPriceRaw = req.query.maxPrice;
        const search = req.query.search;
        
        if (!category) {
            return res.status(400).json({ message: 'Category is required' });
        }
        
        // Decode URI component and normalize
        const normalizedCategory = decodeURIComponent(category).toLowerCase().trim();
        
        // Build query with category and additional filters
        const filter = { category: new RegExp(`^${normalizedCategory}$`, 'i') };
        
        // Add price filters
        if (minPriceRaw !== undefined) {
            const min = parseFloat(minPriceRaw);
            if (!isNaN(min)) filter.price = { ...(filter.price || {}), $gte: min };
        }
        if (maxPriceRaw !== undefined) {
            const max = parseFloat(maxPriceRaw);
            if (!isNaN(max)) filter.price = { ...(filter.price || {}), $lte: max };
        }
        
        // Add search filter
        if (search) {
            filter.$and = [
                { category: new RegExp(`^${normalizedCategory}$`, 'i') },
                {
                    $or: [
                        { name: new RegExp(search, 'i') },
                        { description: new RegExp(search, 'i') }
                    ]
                }
            ];
            delete filter.category; // Remove category from root since it's in $and
        }
        
        // Execute queries in parallel
        const [products, totalProducts] = await Promise.all([
            Product.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(filter)
        ]);
        
        const totalPages = Math.ceil(totalProducts / limit);

        // Respond with products, pagination and filters
        res.status(200).json({
            products,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            },
            filters: {
                category: normalizedCategory,
                minPrice: minPriceRaw,
                maxPrice: maxPriceRaw,
                search,
                sort
            }
        });
    } catch (error) {
        console.error('Error fetching products by category:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const toggleFeaturedProducts = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        product.isFeatured = !product.isFeatured;
        const updatedProduct = await product.save();

        await updateFreaturedProductsCache();
        res.status(200).json({ isFeatured: updatedProduct.isFeatured });
    }
    catch (error) {
        console.error('Error toggling featured product:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }   
}
export const updateFreaturedProductsCache = async () => {
    try {
        // Ensure Redis connection is available
        const isConnected = await ensureRedisConnection();
        if (!isConnected) {
            console.warn('Redis not available, skipping cache update');
            return;
        }

        // lean() is used to return a plain JavaScript object instead of a Mongoose document which is more efficient for caching
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        if (featuredProducts && featuredProducts.length > 0) {
            await client.set('featuredProducts', JSON.stringify(featuredProducts));
        } else {
            await client.del('featuredProducts');
        }
    } catch (error) {
        console.error('Error updating featured products cache:', error.message);
        // Don't throw here as this is a utility function that might be called from other functions
    }
}

// Enhanced searchProducts with better validation and pagination
export const searchProducts = async (req, res) => {
    try {
        const { q, page = 1, limit = 12, sort = '-createdAt' } = req.query;
        
        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        if (q.length < 2) {
            return res.status(400).json({ message: 'Search query must be at least 2 characters' });
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 results per page
        const skip = (pageNum - 1) * limitNum;

        // Sanitize search query
        const sanitizedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(sanitizedQuery, 'i');
        
        const filter = {
            $or: [
                { name: searchRegex },
                { description: searchRegex },
                { category: searchRegex }
            ]
        };

        // Execute search with pagination
        const [products, totalProducts] = await Promise.all([
            Product.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Product.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalProducts / limitNum);
        
        res.status(200).json({
            products,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalProducts,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            searchQuery: q,
            sort
        });
    } catch (error) {
        console.error('Error searching products:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Cache management utilities
export const clearProductCaches = async () => {
    try {
        const isConnected = await ensureRedisConnection();
        if (!isConnected) return;

        const keys = await client.keys('products:*');
        if (keys.length > 0) {
            await client.del(keys);
        }
    } catch (error) {
        console.error('Error clearing product caches:', error.message);
    }
};

// Get product categories with count
export const getProductCategories = async (req, res) => {
    try {
        const categories = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};