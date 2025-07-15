import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Automatically complete orders that have been delivered for a specified number of days
 * This script can be run via cron job or scheduled tasks
 */
async function autoCompleteDeliveredOrders() {
    try {
        console.log('🚀 Starting automatic order completion process...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        // Configuration: Complete orders after X days of delivery
        const DAYS_AFTER_DELIVERY = process.env.AUTO_COMPLETE_DAYS || 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DAYS_AFTER_DELIVERY);
        
        console.log(`📅 Looking for orders delivered before: ${cutoffDate.toISOString()}`);
        
        // Find delivered orders that should be auto-completed
        const ordersToComplete = await Order.find({
            status: 'delivered',
            deliveredAt: { $lte: cutoffDate },
            completedAt: { $exists: false } // Not already completed
        }).populate('user', 'name email');
        
        console.log(`📦 Found ${ordersToComplete.length} orders to auto-complete`);
        
        if (ordersToComplete.length === 0) {
            console.log('✨ No orders need to be completed at this time');
            return;
        }
        
        let completedCount = 0;
        const completedOrders = [];
        
        // Process each order
        for (const order of ordersToComplete) {
            try {
                console.log(`🔄 Processing order ${order._id} (delivered: ${order.deliveredAt?.toISOString()})`);
                
                // Update status to completed
                await order.updateStatus('completed');
                
                completedCount++;
                completedOrders.push({
                    orderId: order._id,
                    userEmail: order.user?.email,
                    deliveredAt: order.deliveredAt,
                    completedAt: order.completedAt,
                    totalAmount: order.totalAmount
                });
                
                console.log(`✅ Completed order ${order._id}`);
                
            } catch (error) {
                console.error(`❌ Error completing order ${order._id}:`, error.message);
            }
        }
        
        console.log(`\n🎉 Auto-completion summary:`);
        console.log(`   • Total orders processed: ${ordersToComplete.length}`);
        console.log(`   • Successfully completed: ${completedCount}`);
        console.log(`   • Failed: ${ordersToComplete.length - completedCount}`);
        
        if (completedOrders.length > 0) {
            console.log(`\n📋 Completed orders:`);
            completedOrders.forEach((order, index) => {
                console.log(`   ${index + 1}. Order: ${order.orderId}`);
                console.log(`      User: ${order.userEmail}`);
                console.log(`      Amount: $${order.totalAmount}`);
                console.log(`      Delivered: ${order.deliveredAt?.toISOString()}`);
                console.log(`      Completed: ${order.completedAt?.toISOString()}`);
                console.log('');
            });
        }
        
        // Optional: Send notification emails or webhook calls here
        // You could integrate with email service or notification system
        
    } catch (error) {
        console.error('❌ Error in auto-completion process:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    }
}

// Function to check what orders would be completed (dry run)
async function checkOrdersForCompletion() {
    try {
        console.log('🔍 Checking orders that would be auto-completed (DRY RUN)...');
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        
        const DAYS_AFTER_DELIVERY = process.env.AUTO_COMPLETE_DAYS || 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DAYS_AFTER_DELIVERY);
        
        const ordersToComplete = await Order.find({
            status: 'delivered',
            deliveredAt: { $lte: cutoffDate },
            completedAt: { $exists: false }
        }).populate('user', 'name email');
        
        console.log(`📦 ${ordersToComplete.length} orders would be auto-completed:`);
        
        ordersToComplete.forEach((order, index) => {
            const daysDelivered = Math.floor((new Date() - order.deliveredAt) / (1000 * 60 * 60 * 24));
            console.log(`${index + 1}. Order: ${order._id}`);
            console.log(`   User: ${order.user?.email}`);
            console.log(`   Delivered: ${daysDelivered} days ago`);
            console.log(`   Amount: $${order.totalAmount}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error checking orders:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    }
}

// Command line interface
const command = process.argv[2];

switch (command) {
    case 'run':
        autoCompleteDeliveredOrders();
        break;
    case 'check':
        checkOrdersForCompletion();
        break;
    default:
        console.log('📚 Usage:');
        console.log('  npm run auto-complete run   - Actually complete eligible orders');
        console.log('  npm run auto-complete check - Check which orders would be completed (dry run)');
        console.log('');
        console.log('📝 Environment variables:');
        console.log('  AUTO_COMPLETE_DAYS - Days after delivery to auto-complete (default: 7)');
        process.exit(0);
}
