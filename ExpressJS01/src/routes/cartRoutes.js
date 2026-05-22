const express = require('express');
const { 
    getCart, 
    addToCart, 
    updateCartItem, 
    removeFromCart, 
    clearCart 
} = require('../controllers/cartController');
const auth = require('../middleware/auth');

const router = express.Router();

// Tất cả các routes cart đều cần auth
router.use(auth);

// Lấy giỏ hàng của người dùng
router.get('/', getCart);

// Thêm sản phẩm vào giỏ hàng
router.post('/add', addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/update', updateCartItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove/:productId', removeFromCart);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', clearCart);

module.exports = router;
