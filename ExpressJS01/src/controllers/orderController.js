const Order = require('../models/order');
const Cart = require('../models/cart');
const Product = require('../models/product');

const AUTO_CONFIRM_MINUTES = 30;

// Helper: Add status to history
const addStatusHistory = (order, status, note = '') => {
    order.statusHistory.push({
        status,
        timestamp: new Date(),
        note
    });
};

// Tạo đơn hàng mới (COD)
const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { shippingAddress, paymentMethod = 'COD', note } = req.body;

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
            return res.status(400).json({ message: "Thông tin giao hàng không đầy đủ" });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống" });
        }

        // Kiểm tra tồn kho
        for (const item of cart.items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ 
                    message: `Sản phẩm không tồn tại: ${item.name}` 
                });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    message: `Sản phẩm "${item.name}" chỉ còn ${product.stock} sản phẩm trong kho` 
                });
            }
        }

        // Tạo đơn hàng với statusHistory ban đầu
        const orderData = {
            user: userId,
            items: cart.items.map(item => ({
                product: item.product,
                name: item.name,
                price: item.price,
                promotionalPrice: item.promotionalPrice,
                image: item.image,
                quantity: item.quantity
            })),
            shippingAddress: {
                ...shippingAddress,
                note: note || ''
            },
            paymentMethod,
            paymentStatus: 'pending',
            orderStatus: 'pending',
            statusHistory: [{
                status: 'pending',
                timestamp: new Date(),
                note: 'Đơn hàng mới được tạo'
            }]
        };

        const order = new Order(orderData);
        await order.save();

        // Trừ tồn kho
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        // Xóa giỏ hàng sau khi tạo đơn
        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'name email')
            .populate('items.product', 'name price');

        return res.status(201).json({
            message: "Đặt hàng thành công",
            order: populatedOrder
        });
    } catch (error) {
        console.error(">>> createOrder error:", error);
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách đơn hàng của người dùng
const getOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;
        
        let query = { user: userId };
        if (status) {
            query.orderStatus = status;
        }

        const orders = await Order.find(query)
            .populate('items.product', 'name price images')
            .sort({ createdAt: -1 });

        return res.status(200).json(orders);
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy chi tiết một đơn hàng
const getOrderById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('user', 'name email')
            .populate('items.product', 'name price images promotionalPrice');

        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        if (order.user._id.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền xem đơn hàng này" });
        }

        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Hủy đơn hàng - với logic mới
const cancelOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền hủy đơn hàng này" });
        }

        // Kiểm tra thời gian hủy (chỉ được hủy trong vòng 30 phút sau khi đặt)
        const createdTime = new Date(order.createdAt).getTime();
        const now = Date.now();
        const timeDiffMinutes = (now - createdTime) / (1000 * 60);

        // Các trạng thái có thể hủy trực tiếp (trong 30 phút)
        const cancellableStatuses = ['pending', 'confirmed'];
        
        // Trạng thái "shop_preparing" chỉ có thể gửi yêu cầu hủy
        const canRequestCancellation = order.orderStatus === 'shop_preparing';

        if (cancellableStatuses.includes(order.orderStatus) && timeDiffMinutes <= AUTO_CONFIRM_MINUTES) {
            // Hủy trực tiếp nếu trong 30 phút và status cho phép
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }

            order.orderStatus = 'cancelled';
            addStatusHistory(order, 'cancelled', reason || 'Khách hàng hủy đơn');
            await order.save();

            return res.status(200).json({
                message: "Hủy đơn hàng thành công",
                order
            });
        } else if (canRequestCancellation) {
            // Nếu đang ở bước "Shop đang chuẩn bị hàng" -> gửi yêu cầu hủy
            order.cancellationRequest = {
                requestedAt: new Date(),
                reason: reason || '',
                status: 'pending'
            };
            addStatusHistory(order, 'cancellation_request', reason || 'Khách hàng gửi yêu cầu hủy đơn');
            await order.save();

            return res.status(200).json({
                message: "Yêu cầu hủy đơn đã được gửi. Shop sẽ xem xét trong thời gian sớm nhất.",
                order,
                isRequest: true
            });
        } else {
            // Quá 30 phút hoặc trạng thái không cho phép hủy
            return res.status(400).json({ 
                message: `Không thể hủy đơn hàng. Đơn đã được xử lý quá ${AUTO_CONFIRM_MINUTES} phút hoặc đang ở trạng thái không cho phép hủy.`,
                canRequestCancellation: false
            });
        }
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Admin: Xử lý yêu cầu hủy đơn
const handleCancellationRequest = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { action, reason } = req.body; // action: 'approve' | 'reject'

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        if (order.cancellationRequest?.status !== 'pending') {
            return res.status(400).json({ message: "Yêu cầu hủy đã được xử lý trước đó" });
        }

        if (action === 'approve') {
            // Duyệt hủy - hoàn kho
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }

            order.orderStatus = 'cancelled';
            order.cancellationRequest.status = 'approved';
            addStatusHistory(order, 'cancelled', `Shop duyệt hủy. Lý do khách: ${reason || order.cancellationRequest.reason}`);
            
        } else if (action === 'reject') {
            // Từ chối hủy
            order.cancellationRequest.status = 'rejected';
            addStatusHistory(order, 'cancellation_rejected', `Shop từ chối hủy. Lý do: ${reason || ''}`);
        } else {
            return res.status(400).json({ message: "Hành động không hợp lệ" });
        }

        await order.save();

        return res.status(200).json({
            message: action === 'approve' ? "Đã duyệt hủy đơn hàng" : "Đã từ chối yêu cầu hủy",
            order
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Admin: Lấy tất cả đơn hàng
const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', cancellationRequest } = req.query;

        let query = {};
        if (status) {
            query.orderStatus = status;
        }
        if (cancellationRequest === 'pending') {
            query['cancellationRequest.status'] = 'pending';
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Search by order ID or customer name
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { 'shippingAddress.fullName': searchRegex },
                { 'shippingAddress.phone': searchRegex },
                { _id: searchRegex }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('items.product', 'name price images')
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        return res.status(200).json({
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Admin: Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus, paymentStatus, note } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        const validTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['shop_preparing', 'cancelled'],
            'shop_preparing': ['shipping', 'cancelled'],
            'shipping': ['delivered'],
            'delivered': [],
            'cancelled': []
        };

        if (orderStatus && orderStatus !== order.orderStatus) {
            if (!validTransitions[order.orderStatus]?.includes(orderStatus)) {
                return res.status(400).json({ 
                    message: `Không thể chuyển từ trạng thái "${order.orderStatus}" sang "${orderStatus}"` 
                });
            }
        }

        if (orderStatus && orderStatus !== order.orderStatus) {
            order.orderStatus = orderStatus;
            const statusNotes = {
                'confirmed': 'Shop xác nhận đơn hàng',
                'shop_preparing': 'Shop đang chuẩn bị hàng',
                'shipping': 'Đơn hàng đang được giao',
                'delivered': 'Giao hàng thành công',
                'cancelled': 'Đơn hàng bị hủy'
            };
            addStatusHistory(order, orderStatus, note || statusNotes[orderStatus] || '');
        }
        if (paymentStatus) {
            order.paymentStatus = paymentStatus;
            order.isPaid = paymentStatus === 'paid';
        }

        await order.save();

        const updatedOrder = await Order.findById(order._id)
            .populate('user', 'name email')
            .populate('items.product', 'name price');

        return res.status(200).json({
            message: "Cập nhật đơn hàng thành công",
            order: updatedOrder
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Admin: Lấy thống kê đơn hàng
const getOrderStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        const [
            totalOrders,
            pendingOrders,
            confirmedOrders,
            shopPreparingOrders,
            shippingOrders,
            deliveredOrders,
            cancelledOrders,
            totalRevenue,
            codOrders,
            paidOrders,
            failedOrders,
            pendingCancellationRequests
        ] = await Promise.all([
            Order.countDocuments(dateFilter),
            Order.countDocuments({ ...dateFilter, orderStatus: 'pending' }),
            Order.countDocuments({ ...dateFilter, orderStatus: 'confirmed' }),
            Order.countDocuments({ ...dateFilter, orderStatus: 'shop_preparing' }),
            Order.countDocuments({ ...dateFilter, orderStatus: 'shipping' }),
            Order.countDocuments({ ...dateFilter, orderStatus: 'delivered' }),
            Order.countDocuments({ ...dateFilter, orderStatus: 'cancelled' }),
            Order.aggregate([
                { $match: { ...dateFilter, orderStatus: { $nin: ['cancelled'] } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Order.countDocuments({ ...dateFilter, paymentMethod: 'COD' }),
            Order.countDocuments({ ...dateFilter, paymentStatus: 'paid' }),
            Order.countDocuments({ ...dateFilter, paymentStatus: 'failed' }),
            Order.countDocuments({ ...dateFilter, 'cancellationRequest.status': 'pending' })
        ]);

        // Thống kê theo ngày (7 ngày gần nhất)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dailyStats = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json({
            summary: {
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                pendingOrders,
                confirmedOrders,
                shopPreparingOrders,
                shippingOrders,
                deliveredOrders,
                cancelledOrders,
                codOrders,
                paidOrders,
                failedOrders,
                pendingCancellationRequests
            },
            dailyStats
        });
    } catch (error) {
        console.error(">>> getOrderStatistics error:", error);
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Admin: Xóa đơn hàng
const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        // Chỉ cho phép xóa đơn hàng đã hủy hoặc đã giao
        if (!['cancelled', 'delivered'].includes(order.orderStatus)) {
            return res.status(400).json({ 
                message: "Chỉ có thể xóa đơn hàng đã hủy hoặc đã giao" 
            });
        }

        await Order.findByIdAndDelete(orderId);

        return res.status(200).json({
            message: "Xóa đơn hàng thành công"
        });
    } catch (error) {
        console.error(">>> deleteOrder error:", error);
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    cancelOrder,
    handleCancellationRequest,
    getAllOrders,
    updateOrderStatus,
    getOrderStatistics,
    deleteOrder
};
