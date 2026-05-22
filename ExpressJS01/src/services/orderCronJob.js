const Order = require('../models/order');
const Product = require('../models/product');

const AUTO_CONFIRM_MINUTES = 30;

const processPendingOrders = async () => {
    try {
        const cutoffTime = new Date(Date.now() - AUTO_CONFIRM_MINUTES * 60 * 1000);
        
        const pendingOrders = await Order.find({
            orderStatus: 'pending',
            createdAt: { $lte: cutoffTime }
        });

        console.log(`[CronJob] Found ${pendingOrders.length} pending orders to auto-confirm`);

        for (const order of pendingOrders) {
            try {
                order.orderStatus = 'confirmed';
                order.statusHistory.push({
                    status: 'confirmed',
                    timestamp: new Date(),
                    note: 'Tự động xác nhận sau 30 phút'
                });
                await order.save();

                console.log(`[CronJob] Auto-confirmed order: ${order._id}`);
            } catch (error) {
                console.error(`[CronJob] Error confirming order ${order._id}:`, error);
            }
        }
    } catch (error) {
        console.error('[CronJob] Error processing pending orders:', error);
    }
};

const startOrderCronJob = (intervalMinutes = 1) => {
    console.log(`[CronJob] Starting order auto-confirmation job (every ${intervalMinutes} minutes)`);
    
    processPendingOrders();
    
    return setInterval(processPendingOrders, intervalMinutes * 60 * 1000);
};

const stopOrderCronJob = (intervalId) => {
    if (intervalId) {
        clearInterval(intervalId);
        console.log('[CronJob] Stopped order auto-confirmation job');
    }
};

module.exports = {
    startOrderCronJob,
    stopOrderCronJob,
    AUTO_CONFIRM_MINUTES
};
