const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
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
    images: [{
        type: String // Mảng chứa URL ảnh
    }],
    stock: {
        type: Number,
        default: 0
    },
    sold: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    // Các trường mới cho tìm kiếm và lọc nâng cao
    brand: {
        type: String,
        trim: true,
        default: ''
    },
    color: {
        type: String,
        trim: true,
        default: ''
    },
    storage: {
        type: String,
        trim: true,
        default: ''
    },
    screenSize: {
        type: String,
        trim: true,
        default: ''
    },
    operatingSystem: {
        type: String,
        trim: true,
        default: ''
    },
    ram: {
        type: String,
        trim: true,
        default: ''
    },
    cpu: {
        type: String,
        trim: true,
        default: ''
    },
    battery: {
        type: String,
        trim: true,
        default: ''
    },
    camera: {
        type: String,
        trim: true,
        default: ''
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numReviews: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        trim: true
    }]
}, { timestamps: true });

// Tạo index cho các trường tìm kiếm và lọc
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ color: 1 });
productSchema.index({ storage: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ sold: -1 });
productSchema.index({ views: -1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
