const Cart = require('../models/cart');
const Product = require('../models/product');

// Lấy giỏ hàng của người dùng
const getCart = async (req, res) => {
    try {
        const userId = req.user._id;
        
        let cart = await Cart.findOne({ user: userId })
            .populate('items.product', 'name price promotionalPrice images stock');
        
        if (!cart) {
            cart = { items: [], totalAmount: 0 };
        }
        
        return res.status(200).json(cart);
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity = 1 } = req.body;
        
        console.log(">>> addToCart called:", { userId, productId, quantity });
        
        if (!productId) {
            return res.status(400).json({ message: "Thiếu productId" });
        }
        
        if (quantity < 1) {
            return res.status(400).json({ message: "Số lượng phải lớn hơn 0" });
        }
        
        const product = await Product.findById(productId);
        if (!product) {
            console.error("Product not found:", productId);
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
        
        const stock = product.stock || 0;
        if (stock < quantity) {
            return res.status(400).json({ message: "Số lượng trong kho không đủ" });
        }
        
        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            console.log(">>> Creating new cart for user:", userId);
            cart = new Cart({
                user: userId,
                items: [{
                    product: product._id,
                    name: product.name,
                    price: product.price,
                    promotionalPrice: product.promotionalPrice,
                    image: product.images && product.images.length > 0 ? product.images[0] : '',
                    quantity: quantity
                }]
            });
        } else {
            const existingItemIndex = cart.items.findIndex(
                item => item.product.toString() === productId
            );
            
            if (existingItemIndex !== -1) {
                const newQuantity = cart.items[existingItemIndex].quantity + quantity;
                
                const updatedStock = product.stock || 0;
                if (updatedStock < newQuantity) {
                    return res.status(400).json({ message: "Số lượng trong kho không đủ" });
                }
                
                cart.items[existingItemIndex].quantity = newQuantity;
            } else {
                cart.items.push({
                    product: product._id,
                    name: product.name,
                    price: product.price,
                    promotionalPrice: product.promotionalPrice,
                    image: product.images && product.images.length > 0 ? product.images[0] : '',
                    quantity: quantity
                });
            }
        }
        
        console.log(">>> Saving cart...");
        await cart.save();
        console.log(">>> Cart saved successfully");
        
        let populatedCart;
        try {
            populatedCart = await Cart.findById(cart._id)
                .populate('items.product', 'name price promotionalPrice images stock');
        } catch (popError) {
            console.error("Error populating cart:", popError);
            populatedCart = cart;
        }
        
        return res.status(200).json({
            message: "Thêm vào giỏ hàng thành công",
            cart: populatedCart,
            items: populatedCart ? populatedCart.items : [],
            totalAmount: populatedCart ? populatedCart.totalAmount : 0
        });
    } catch (error) {
        console.error(">>> addToCart error:", error);
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;
        
        if (!productId) {
            return res.status(400).json({ message: "Thiếu productId" });
        }
        
        if (quantity < 1) {
            return res.status(400).json({ message: "Số lượng phải lớn hơn 0" });
        }
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
        
        const stock = product.stock || 0;
        if (stock < quantity) {
            return res.status(400).json({ message: "Số lượng trong kho không đủ" });
        }
        
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
        }
        
        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });
        }
        
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        
        const populatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price promotionalPrice images stock');
        
        return res.status(200).json({
            message: "Cập nhật giỏ hàng thành công",
            cart: populatedCart
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Xóa sản phẩm khỏi giỏ hàng
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;
        
        if (!productId) {
            return res.status(400).json({ message: "Thiếu productId" });
        }
        
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
        }
        
        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });
        }
        
        cart.items.splice(itemIndex, 1);
        await cart.save();
        
        const populatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price promotionalPrice images stock');
        
        return res.status(200).json({
            message: "Xóa sản phẩm khỏi giỏ hàng thành công",
            cart: populatedCart
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
        }
        
        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();
        
        return res.status(200).json({
            message: "Xóa toàn bộ giỏ hàng thành công",
            cart: cart
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
