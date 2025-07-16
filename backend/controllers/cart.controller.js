import Product from "../models/product.model.js";

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
        const { productId, size } = req.body;
        const user = req.user;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // If product has sizes, validate the provided size
        if (product.sizes && product.sizes.length > 0) {
            if (!size) {
                return res.status(400).json({ message: 'Size is required for this product' });
            }
            if (!product.sizes.includes(size)) {
                return res.status(400).json({ message: 'Invalid size for this product' });
            }
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
            // If the item already exists in the cart, increment the quantity
            existingItem.quantity += 1;
        } else {
            // Add new item to cart
            const cartItem = { product: productId, quantity: 1 };
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
            user.cartItems = [];
        } else {
            // Remove specific product from cart
            let itemIndex = -1;
            
            // Check if productId contains size information (format: productId-size)
            if (productId.includes('-')) {
                const [pid, size] = productId.split('-');
                itemIndex = user.cartItems.findIndex(item => 
                    item.product && 
                    item.product.toString() === pid && 
                    item.size === size
                );
            } else {
                // Regular product without size
                itemIndex = user.cartItems.findIndex(item => 
                    item.product && 
                    item.product.toString() === productId &&
                    !item.size
                );
            }
            
            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Product not found in cart' });
            }
            user.cartItems.splice(itemIndex, 1);
        }

        await user.save();
        res.status(200).json(user.cartItems);
    } catch (error) {
        console.error('Error removing from cart:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}
export const updateQuantity = async (req, res) => {
    try {
        const { id: cartId } = req.params; // This could be productId or productId-size
        const { quantity } = req.body;
        const user = req.user;
        
        // Clean up any invalid cart items first
        user.cartItems = cleanupCartItems(user.cartItems);
        
        let existingItem;
        
        // Check if cartId contains size information (format: productId-size)
        if (cartId.includes('-')) {
            const [productId, size] = cartId.split('-');
            existingItem = user.cartItems.find(item => 
                item.product && 
                item.product.toString() === productId && 
                item.size === size
            );
        } else {
            // Regular product without size
            existingItem = user.cartItems.find(item => 
                item.product && 
                item.product.toString() === cartId &&
                !item.size
            );
        }
        
        if (existingItem) {
            if (quantity <= 0) {
                // Remove the item from the cart
                const itemIndex = user.cartItems.indexOf(existingItem);
                user.cartItems.splice(itemIndex, 1);
            } else {
                // Update the quantity of the existing item
                existingItem.quantity = quantity;
            }
            
            await user.save();
            return res.status(200).json(user.cartItems);
        } else {
            return res.status(404).json({ message: 'Product not found in cart' });
        }
    } catch (error) {
        console.error('Error updating quantity:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}
