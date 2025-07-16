import Product from "../models/product.model.js";
import { validateStock, getAvailableStock } from "../lib/stockValidation.js";

// Utility function to clean up invalid cart items
const cleanupCartItems = (cartItems) => {
    return cartItems.filter(item => 
        item && 
        item.product != null && 
        item.quantity != null && 
        item.quantity > 0
    );
};
export const getCartProducts = async (req, res) => {
    try {
        const user = req.user;
        
        // Clean up any invalid cart items first
        user.cartItems = cleanupCartItems(user.cartItems);
        await user.save();
        
        const productIds = user.cartItems.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds } });
        
        const cartItems = user.cartItems.map(cartItem => {
            const product = products.find(p => p._id.toString() === cartItem.product.toString());
            if (!product) return null;
            
            return {
                ...product.toJSON(), 
                quantity: cartItem.quantity,
                selectedSize: cartItem.size || null,
                cartId: cartItem.size ? `${product._id}-${cartItem.size}` : product._id.toString()
            };
        }).filter(Boolean); // Remove null items
        
        return res.status(200).json(cartItems);
    } catch (error) {
        console.error('Error fetching cart items:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}
export const addToCart = async (req, res) => {
    try {
        const { productId, size, quantity = 1 } = req.body;
        const user = req.user;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Validate stock using utility function
        const stockValidation = validateStock(product, size, quantity);
        if (!stockValidation.isValid) {
            return res.status(400).json({ message: stockValidation.message });
        }
        
        // Clean up any invalid cart items first
        user.cartItems = cleanupCartItems(user.cartItems);
        
        // For products with sizes, check both product ID and size
        const existingItem = user.cartItems.find(item => 
            item.product && 
            item.product.toString() === productId &&
            ((!size && !item.size) || item.size === size)
        );
        
        if (existingItem) {
            // Check if adding this quantity would exceed stock
            const newTotalQuantity = existingItem.quantity + quantity;
            const totalValidation = validateStock(product, size, newTotalQuantity);
            if (!totalValidation.isValid) {
                return res.status(400).json({ 
                    message: `Only ${stockValidation.availableStock} items available in stock${size ? ` for size ${size}` : ''}. You already have ${existingItem.quantity} in your cart.`
                });
            }
            existingItem.quantity = newTotalQuantity;
        } else {
            // Add new item to cart
            const cartItem = { product: productId, quantity: quantity };
            if (size) {
                cartItem.size = size;
            }
            user.cartItems.push(cartItem);
        }
        
        await user.save();
        return res.status(200).json(user.cartItems);
    } catch (error) {
        console.error('Error adding to cart:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body; // This could be productId or cartId (productId-size)
        const user = req.user;

        if (!productId) {
            // Clear entire cart if no productId provided
            console.log('🗑️ Clearing entire cart');
            user.cartItems = [];
        } else {
            console.log('🗑️ Removing specific product:', productId);
            // Remove specific product from cart
            let itemIndex = -1;
            
            // Check if productId contains size information (format: productId-size)
            if (productId.includes('-')) {
                const [pid, size] = productId.split('-');
                console.log('🗑️ Looking for product with size:', { pid, size });
                itemIndex = user.cartItems.findIndex(item => 
                    item.product && 
                    item.product.toString() === pid && 
                    item.size === size
                );
            } else {
                console.log('🗑️ Looking for product without size:', productId);
                // Regular product without size
                itemIndex = user.cartItems.findIndex(item => 
                    item.product && 
                    item.product.toString() === productId &&
                    !item.size
                );
            }
            
            console.log('🗑️ Item index found:', itemIndex);
            console.log('🗑️ Current cart items:', user.cartItems.map(item => ({
                productId: item.product?.toString(),
                size: item.size,
                quantity: item.quantity
            })));
            
            if (itemIndex === -1) {
                console.log('🗑️ Product not found in cart, but returning success to avoid client errors');
                // Instead of returning 404, return success - item is already not in cart
                return res.status(200).json({ 
                    message: 'Item was not in cart or already removed',
                    cartItems: user.cartItems 
                });
            }
            user.cartItems.splice(itemIndex, 1);
            console.log('🗑️ Item removed, remaining items:', user.cartItems.length);
        }

        await user.save();
        console.log('🗑️ Cart updated successfully');
        res.status(200).json(user.cartItems);
    } catch (error) {
        console.error('❌ Error removing from cart:', error.message);
        console.error('❌ Stack trace:', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
}
export const updateQuantity = async (req, res) => {
    try {
        const { id: cartId } = req.params; // This could be productId or productId-size
        const { quantity } = req.body;
        const user = req.user;
        
        if (quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than 0' });
        }
        
        // Clean up any invalid cart items first
        user.cartItems = cleanupCartItems(user.cartItems);
        
        let existingItem;
        let productId, size;
        
        // Check if cartId contains size information (format: productId-size)
        if (cartId.includes('-')) {
            [productId, size] = cartId.split('-');
            existingItem = user.cartItems.find(item => 
                item.product && 
                item.product.toString() === productId && 
                item.size === size
            );
        } else {
            productId = cartId;
            // Regular product without size
            existingItem = user.cartItems.find(item => 
                item.product && 
                item.product.toString() === cartId &&
                !item.size
            );
        }
        
        if (!existingItem) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }
        
        // Get product and validate stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Check stock availability
        let availableStock = 0;
        if (product.sizes && product.sizes.length > 0 && size) {
            // For products with sizes
            availableStock = product.stock && product.stock.get ? 
                product.stock.get(size) : 
                (product.stock && product.stock[size]) || 0;
        } else {
            // For products without sizes
            availableStock = typeof product.stock === 'number' ? product.stock : 0;
        }

        if (quantity > availableStock) {
            return res.status(400).json({ 
                message: `Only ${availableStock} items available in stock${size ? ` for size ${size}` : ''}`
            });
        }
        
        // Update the quantity
        existingItem.quantity = quantity;
          await user.save();
        return res.status(200).json(user.cartItems);
    } catch (error) {
        console.error('Error updating quantity:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}
