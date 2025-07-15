import Coupon from '../models/coupon.model.js';
import { initStripe } from '../lib/stripe.js'
import Order from '../models/order.model.js';
import User from '../models/user.model.js';

export const createCheckoutSession = async (req, res) => {
try {
    const stripe = initStripe();
    const {products, couponCode, shippingAddressId} = req.body;
    if(!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: 'Products are required' });
    }

    if (!shippingAddressId) {
        return res.status(400).json({ message: 'Shipping address is required' });
    }

    let totalAmount = 0;
    const lineItems = products.map(product => {
        const amount= Math.round(product.price * 100); // Convert to cents
        totalAmount += amount * product.quantity;
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: product.name,
                    images:[product.image],
                },
                unit_amount: amount,
            },
            quantity: product.quantity,        };
    });    let coupon = null;
    if (couponCode) {
        // Check for user-specific coupon
        coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
        if (!coupon) {
            return res.status(400).json({ message: 'Invalid or expired coupon' });
        }
        
        // Check if coupon has expired
        const currentDate = new Date();
        if (coupon.expirationDate < currentDate) {
            coupon.isActive = false;
            await coupon.save();
            return res.status(400).json({ message: 'Coupon has expired' });
        }
    }
    
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,        discounts: coupon
            ? [{
                coupon: await createStripeCoupon(stripe, coupon.discountPercentage)
            }]
            : [],metadata: {
            userId: req.user._id.toString(),
            couponCode: couponCode || "",
            shippingAddressId: shippingAddressId,
            products: JSON.stringify(
                products.map((p) => ({
                    id: p._id,
                    quantity: p.quantity,
                    price: p.price,
                }))
            )
        },});
    
    if (totalAmount >= 20000) {
        await createNewCoupon(req.user._id);
    }
    
    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
} catch (error) {
   console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Internal server error' }); 
}
}

export const checkoutSucess = async (req, res) => {
    try {
        const stripe = initStripe();
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }        if (session.payment_status === 'paid') {
            // Get the user and shipping address
            const user = await User.findById(session.metadata.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const shippingAddress = user.addresses.id(session.metadata.shippingAddressId);
            if (!shippingAddress) {
                return res.status(404).json({ message: 'Shipping address not found' });
            }

            // Deactivate coupon if used (user-specific)
            if (session.metadata.couponCode) {
                await Coupon.findOneAndUpdate(
                    { code: session.metadata.couponCode, userId: session.metadata.userId, isActive: true },
                    { isActive: false }
                );
            }
              // Create a new order with proper status for successful payment
            const products = JSON.parse(session.metadata.products);
            const newOrder = new Order({
                user: session.metadata.userId,
                products: products.map((p) => ({
                    product: p.id,
                    quantity: p.quantity,
                    price: p.price,
                })),
                totalAmount: session.amount_total / 100, // Convert cents to dollars
                shippingAddress: {
                    type: shippingAddress.type,
                    street: shippingAddress.street,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    zipCode: shippingAddress.zipCode,
                    country: shippingAddress.country
                },
                stripeSessionId: session.id,
                status: 'processing', // Set status to processing since payment is successful
                paymentStatus: 'completed' // Mark payment as completed
            });
            
            await newOrder.save();
            console.log('Order created successfully:', newOrder);
            
            return res.status(200).json({
                success: true,
                message: "Payment successful, order created, and coupon deactivated if used.",
                orderId: newOrder._id,
            });
        } else {
            return res.status(400).json({ message: 'Payment not completed' });
        }
    } catch (error) {
        console.error('Error processing payment success:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function createStripeCoupon(stripe, discountPercentage) {
    try {
        const coupon = await stripe.coupons.create({
            percent_off: discountPercentage,
            duration: 'once',
        });
        return coupon.id;
    } catch (error) {
        console.error('Error creating Stripe coupon:', error);
        throw error;
    }
}
async function createNewCoupon(userId) {
    await Coupon.findOneAndDelete({ userId: userId });
    // Create a new coupon with a unique code and a 10% discount
    const newCoupon = new Coupon({
       code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
       discountPercentage: 10, // Example discount percentage
       expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
       userId: userId,
    });
    await newCoupon.save();
    return newCoupon;
}
    