import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkExistingOrders() {
    try {
        console.log('🔍 Checking existing orders...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        // Find all orders and their statuses
        const orders = await Order.find({}).sort({ createdAt: -1 }).limit(10);
        console.log(`\n📊 Found ${orders.length} recent orders:`);
        
        orders.forEach((order, index) => {
            console.log(`${index + 1}. Order ID: ${order._id}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Payment Status: ${order.paymentStatus}`);
            console.log(`   Total: $${order.totalAmount}`);
            console.log(`   Created: ${order.createdAt}`);
            console.log(`   Stripe Session: ${order.stripeSessionId || 'N/A'}`);
            console.log('');
        });
        
        // Check for pending orders specifically
        const pendingOrders = await Order.find({ status: 'pending' });
        console.log(`\n⚠️  Found ${pendingOrders.length} pending orders:`);
        
        pendingOrders.forEach((order, index) => {
            console.log(`${index + 1}. Order ID: ${order._id}`);
            console.log(`   Payment Status: ${order.paymentStatus}`);
            console.log(`   Created: ${order.createdAt}`);
            console.log(`   Stripe Session: ${order.stripeSessionId || 'N/A'}`);
            console.log('');
        });
        
        // Check for orders with completed payment but pending status
        const inconsistentOrders = await Order.find({ 
            paymentStatus: 'completed', 
            status: 'pending' 
        });
        console.log(`\n🚨 Found ${inconsistentOrders.length} orders with completed payment but pending status:`);
        
        inconsistentOrders.forEach((order, index) => {
            console.log(`${index + 1}. Order ID: ${order._id}`);
            console.log(`   Created: ${order.createdAt}`);
            console.log(`   Stripe Session: ${order.stripeSessionId || 'N/A'}`);
        });
        
        if (inconsistentOrders.length > 0) {
            console.log('\n💡 These orders should be updated to "processing" status.');
            console.log('Would you like to fix them? (This is just a report, no changes made)');
        }
        
    } catch (error) {
        console.error('❌ Error checking orders:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(0);
    }
}

checkExistingOrders();
