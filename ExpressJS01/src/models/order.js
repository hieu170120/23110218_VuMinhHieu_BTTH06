const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    promotionalPrice: {
        type: Number,
        default: null
    },
    image: {
        type: String,
        default: ''
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: true });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        default: 0
    },
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, default: 'TP. Hồ Chí Minh' },
        district: { type: String, default: '' },
        ward: { type: String, default: '' },
        note: { type: String, default: '' }
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'VNPAY', 'MOMO', 'ZALOPAY'],
        default: 'COD'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'shop_preparing', 'shipping', 'delivered', 'cancelled'],
        default: 'pending'
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    // Trường mới cho yêu cầu hủy đơn
    cancellationRequest: {
        requestedAt: { type: Date, default: null },
        reason: { type: String, default: '' },
        status: { 
            type: String, 
            enum: ['none', 'pending', 'approved', 'rejected'],
            default: 'none'
        }
    },
    // Theo dõi timeline trạng thái
    statusHistory: [{
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' }
    }]
}, { timestamps: true });

orderSchema.pre('save', async function() {
    this.totalAmount = this.items.reduce((total, item) => {
        const price = item.promotionalPrice !== null ? item.promotionalPrice : item.price;
        return total + (price * item.quantity);
    }, 0);
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
