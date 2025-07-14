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
        
        const cartItems = products.map(product => {
            const item = user.cartItems.find(cartItem => 
                cartItem.product && cartItem.product.toString() === product._id.toString()
            );
            return {
                ...product.toJSON(), 
                quantity: item ? item.quantity : 1
            };
        });
        
        return res.status(200).json(cartItems);
    } catch (error) {
        console.error('Error fetching cart items:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}
export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        // Clean up any invalid cart items first
        user.cartItems = cleanupCartItems(user.cartItems);
        
        const existingItem = user.cartItems.find(item => 
            item.product && item.product.toString() === productId
        );
        
        if (existingItem) {
            // If the item already exists in the cart, increment the quantity
            existingItem.quantity += 1;
        } else {
            // Add new item to cart
            user.cartItems.push({ product: productId, quantity: 1 });
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
        const { productId } = req.body;
        const user = req.user;

        if (!productId) {
            // Clear entire cart if no productId provided
            user.cartItems = [];
        } else {
            // Remove specific product from cart
            const itemIndex = user.cartItems.findIndex(item => 
                item.product && item.product.toString() === productId
            );
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
        const { id: productId } = req.params;
        const { quantity } = req.body;
        const user = req.user;
        
        const existingItem = user.cartItems.find(item => 
            item.product && item.product.toString() === productId
        );
        
        if (existingItem) {
            if (quantity <= 0) {
                // If quantity is 0 or less, remove the item from the cart
                user.cartItems = user.cartItems.filter(item => 
                    !item.product || item.product.toString() !== productId
                );
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
