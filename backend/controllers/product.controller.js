import { client } from '../lib/redis.js';
import cloudinary from '../lib/cloudinary.js';
import Product from '../models/product.model.js';
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
        await client.connect();
        let featuredProducts = await client.get('featuredProducts');
        if (featuredProducts) {
            featuredProducts = JSON.parse(featuredProducts);
            return res.status(200).json(featuredProducts);

        }
        featuredProducts = await Product.find({ isFeatured: true }).lean();
        if (!featuredProducts || featuredProducts.length === 0) {
            return res.status(404).json({ message: 'No featured products found' });
        }
        await client.set('featuredProducts', JSON.stringify(featuredProducts));
    } catch (error) {
        console.error('Error fetching featured products:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const createProducts = async (req, res) => {
    try {
        const { name, price, description, image, prize, category } = req.body;
        if (!name || !price || !description || !image || !category || !prize) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        let cloudinaryResponse;
        if (image) {
            await cloudinary.v2.uploader.upload(image, {
                folder: 'products',
                resource_type: 'image'
            }).then((result) => {
                cloudinaryResponse = result;
            }).catch((error) => {
                console.error('Cloudinary upload error:', error);
                return res.status(500).json({ message: 'Image upload failed' });
            });

        }
        else {
            return res.status(400).json({ message: 'Invalid image URL' });
        }
        const Product = await Product.create({
            name,
            price,
            description,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
            category
        });

        res.status(201).json(Product);
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
        if (product.image) {
            const publicId = product.image.split('/').pop().split('.')[0];
            try {
                await cloudinary.v2.uploader.destroy(`products/${publicId}`, {
                    resource_type: 'image'
                })
                console.log('Image deleted from Cloudinary');
            } catch (error) {
                console.error('Error deleting image from Cloudinary:', error.message);
                return res.status(500).json({ message: 'Failed to delete image from Cloudinary' });
            }
        }
        await Product.findByIdAndDelete(id);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: { size: 3 } // Randomly select 3 products
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    price: 1,
                    description: 1,
                    image: 1,
                }
            }
        ]);
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching recommended products:', error.message);
        res.status(500).json({ message: 'Internal server error' });

    }
}


export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        if (!category) {
            return res.status(400).json({ message: 'Category is required' });
        }
        const products = await Product.find({ category });
        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found in this category' });
        }
        res.status(200).json(products);
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
        const updateProduct = await product.save();
        await client.connect();
        await updateFreaturedProductsCache();
        res.status(200).json({ message: 'Product featured status updated', product });
    } catch (error) {
        console.error('Error toggling featured status:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}
export const updateFreaturedProductsCache = async () => {
    try {
        // lean() is used to return a plain JavaScript object instead of a Mongoose document which is more efficient for caching
        await client.connect();
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        if (featuredProducts && featuredProducts.length > 0) {
            await client.set('featuredProducts', JSON.stringify(featuredProducts));
        } else {
            await client.del('featuredProducts');
        }
    } catch (error) {
        console.error('Error updating featured products cache:', error.message);
    }
}