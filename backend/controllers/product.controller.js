import { client } from '../lib/redis.js';
import { ensureRedisConnection } from '../lib/redis.js';
import cloudinary from '../lib/cloudinary.js';
import Product from '../models/product.model.js';
export const getAllProducts = async (_req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

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
export const createProducts = async (req, res) => {
    try {
        const { name, price, description, image, category } = req.body;
        if (!name || !price || !description || !image || !category) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        let cloudinaryResponse;
        if (image) {
            try {
                cloudinaryResponse = await cloudinary.uploader.upload(image, {
                    folder: 'products',
                    resource_type: 'image'
                });
            } catch (error) {
                console.error('Cloudinary upload error:', error);
                return res.status(500).json({ message: 'Image upload failed' });
            }
        } else {
            return res.status(400).json({ message: 'Invalid image URL' });
        }
        const product = await Product.create({
            name,
            price,
            description,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
            category
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}



export const deleteProducts = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Delete image from Cloudinary if it exists
        if (product.image) {
            const publicId = product.image.split('/').pop().split('.')[0];
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`, {
                    resource_type: 'image'
                });
                console.log('Image deleted from Cloudinary');
            } catch (error) {
                console.error('Error deleting image from Cloudinary:', error.message);
                // Don't return here, continue to delete the product from database
            }
        }
        
        // Delete the product from database
        await Product.findByIdAndDelete(id);
        
        // Update featured products cache if needed
        await updateFreaturedProductsCache();
        
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

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
}
 
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}
 
export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        
        if (!category) {
            return res.status(400).json({ message: 'Category is required' });
        }
        
        // Decode URI component in case of URL encoding and normalize case
        const normalizedCategory = decodeURIComponent(category).toLowerCase().trim();
        
        const products = await Product.find({ category: normalizedCategory });
        
        res.status(200).json({ products });
    } catch (error) {
        console.error('Error fetching products by category:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

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

export const searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchRegex = new RegExp(q, 'i'); // Case-insensitive search
        
        const products = await Product.find({
            $or: [
                { name: searchRegex },
                { description: searchRegex },
                { category: searchRegex }
            ]
        }).limit(20); // Limit results to 20
        
        res.status(200).json(products);
    } catch (error) {
        console.error('Error searching products:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}