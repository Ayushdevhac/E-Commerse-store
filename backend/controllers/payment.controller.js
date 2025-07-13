import Coupon from '../models/coupon.model.js';
import {stripe} from '../lib/stripe.js'
import Order from '../models/order.model.js';  
import dotenv from "dotenv";
dotenv.config();

export const createCheckoutSession = async (req, res) => {
try {
    const {products,couponcode} = req.body;
    if(!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: 'Products are required' });
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
            quantity: product.quantity,
        };
    });
    let coupon=null;
    if(couponcode) {
        coupon = await Coupon.findOne({ code: couponcode, userId: req.user._id, isActive: true })   ;
        if(coupon){
            totalAmount -= Math.random((totalAmount * coupon.discountPercentage) / 100); // Apply discount
        }
    }
    const session = await stripe.checkout.sessions.create({
        payment_methods_types:["cards"],
        line_items:lineItems,
        mode:"payment",
        success_url:`${process.env.CLIENT_URL}/purchase-sucess?session_id={CHECKOUT_SESSION_ID`,
      cancel_url:`${process.env.CLIENT_URL}/purchase-cancel`,
      discounts:coupon
      ?[{
        coupon :await createSTripeCoupon(coupon.discountPercentage)
      },
      ]
     :[],
        metadata: {
            userId: req.user._id.toString(),
           couponCode: couponcode || "",
           products:JSON.stringify(
             products.map((p) => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price,
                    })))
        },  

});
if(totalAmount>=20000){
    await createNewCoupon(req.user._id);
}
    res.status(200).json({ Id: session.id ,totalAmount: totalAmount / 100});
} catch (error) {
   console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Internal server error' }); 
}
}

export const checkoutSucess = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if(session.payment_status === 'paid') {
            if(session.metadata.ouponCode) {
                await Coupon.findOneAndUpdate(
                    { code: session.metadata.couponCode, userId: session.metadata.userId },
                    { isActive: false },
                 
                );
            }
            // create a new order
            const products=JSON.parse(session.metadata.products);
        }
        res.status(200).json({ message: 'Payment successful', session });
        const newOrder = new Order({
            user: session.metadata.userId,
            products: products.map((p) => ({
                product: p.id,
                quantity: p.quantity,
                price: p.price,    })),
            totalAmount: session.amount_total / 100, // Convert cents to dollars
            stripeSessionId: session.id,

        });
        await newOrder.save();
        console.log('Order created successfully:', newOrder);
       	res.status(200).json({
				success: true,
				message: "Payment successful, order created, and coupon deactivated if used.",
				orderId: newOrder._id,
			});
            
    } catch (error) {
        console.error('Error processing payment success:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function createSTripeCoupon(discountPercentage) {
    const coupon = await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: 'once',
    });
    return coupon.id;
    
}
async function createNewCoupon(userId) {
    const newCoupon= new Coupon({
       code:"GIFT"+ Math.random().toString(36).substring(2, 8).toUpperCase(),
       discountPercentage: 10, // Example discount percentage
       expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
         userId: userId,
})
    await newcoupon.save();
    return newCoupon;
}
    