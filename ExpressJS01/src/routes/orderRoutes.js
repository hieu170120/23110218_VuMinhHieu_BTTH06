const express = require('express');
const { 
    createOrder, 
    getOrders, 
    getOrderById, 
    cancelOrder,
    handleCancellationRequest,
    getAllOrders,
    updateOrderStatus,
    getOrderStatistics,
    deleteOrder
} = require('../controllers/orderController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Admin routes - phải để TRƯỚC /:orderId để tránh bị đón mất
router.get('/admin/all', auth, isAdmin, getAllOrders);
router.get('/admin/statistics', auth, isAdmin, getOrderStatistics);

// User routes - cần auth
router.post('/', auth, createOrder);
router.get('/', auth, getOrders);
router.get('/:orderId', auth, getOrderById);
router.put('/:orderId/cancel', auth, cancelOrder);

// Admin routes còn lại
router.put('/:orderId/status', auth, isAdmin, updateOrderStatus);
router.put('/:orderId/cancellation-request', auth, isAdmin, handleCancellationRequest);
router.delete('/:orderId', auth, isAdmin, deleteOrder);

module.exports = router;
