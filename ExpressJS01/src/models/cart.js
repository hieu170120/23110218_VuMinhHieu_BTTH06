const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
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
        min: 1,
        default: 1
    }
}, { _id: true });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Middleware để tính tổng tiền trước khi lưu
cartSchema.pre('save', async function() {
    this.totalAmount = this.items.reduce((total, item) => {
        const price = item.promotionalPrice !== null ? item.promotionalPrice : item.price;
        return total + (price * item.quantity);
    }, 0);
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
