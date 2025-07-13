import Product from "../models/product.model.js";
export const getCartProducts = async (req, res) => {
    try {
        const user = req.user;
        const products = await Product.find({ _id: { $in: user.cartItems } });
        const cartItems = products.map(product => {
            const item = req.user.cartItems.find(item => item.id === product._id);
            return {
                ...product.toJSON(), quantity: item.quantity
            };
                 })
                 return res.status(200).json({ cartItems });
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
            return res.status(400).json({ message: 'Product ID are required' });
        }
        const exitingItem = await user.cartItems.find(item => item.id === productId);
        if (exitingItem) {
            // If the item already exists in the cart, increment the quantity
            exitingItem.quantity += 1;
            await user.save();
            return res.status(200).json({ message: 'Product quantity updated', cartItems: user.cartItems });
        } else {

            user.cartItems.push(productId);

        }
        await user.save();
        return res.status(201).json({ message: 'Product added to cart', cartItems: user.cartItems });
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
            user.cartItems = [];
        }

        const itemIndex = user.cartItems.findIndex(item => item.id === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        user.cartItems.splice(itemIndex, 1);
        await user.save();

        res.status(200).json({ message: 'Product removed from cart', cartItems: user.cartItems });
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
        const exitingItem = user.cartItems.find(item => item.id === productId);
        if (exitingItem) {
            if (quantity <= 0) {
                // If quantity is 0 or less, remove the item from the cart
                user.cartItems = user.cartItems.filter(item => item.id !== productId);
                await user.save();
                return res.status(200).json({ message: 'Item removed from cart', cartItems: user.cartItems });
            }
            // Update the quantity of the existing item
            exitingItem.quantity = quantity;

            await user.save();
            return res.status(200).json({ message: 'Cart updated successfully', cartItems: user.cartItems });
        } else {
            return res.status(404).json({ message: 'Product not found in cart' });
        }
    } catch (error) {
        console.error('Error updating quantity:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}
