const Product = require('../models/product');
const Category = require('../models/category');



// Lấy dữ liệu cho Trang Chủ
const getHomepageProducts = async (req, res) => {
    try {
        // Sản phẩm mới nhất (sắp xếp theo createdAt giảm dần, lấy 4)
        const latestProducts = await Product.find().sort({ createdAt: -1 }).limit(4).populate('category', 'name');
        
        // Sản phẩm bán chạy nhất (sắp xếp theo sold giảm dần, lấy 4)
        const bestSellingProducts = await Product.find().sort({ sold: -1 }).limit(4).populate('category', 'name');

        // Sản phẩm khuyến mãi (promotionalPrice < price)
        const promotionalProducts = await Product.find({
            $and: [
                { promotionalPrice: { $ne: null } },
                { $expr: { $lt: ["$promotionalPrice", "$price"] } }
            ]
        }).limit(4).populate('category', 'name');

        return res.status(200).json({
            latestProducts,
            bestSellingProducts,
            promotionalProducts
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy chi tiết sản phẩm
const getProductDetails = async (req, res) => {
    try {
        const { id } = req.params;
        // Tăng views mỗi lần xem chi tiết
        const product = await Product.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        ).populate('category', 'name');
        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        // Tìm sản phẩm tương tự (cùng category, khác id hiện tại)
        const similarProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id }
        }).limit(4);

        return res.status(200).json({
            product,
            similarProducts
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy sản phẩm theo danh mục có phân trang server-side
const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip  = (page - 1) * limit;

        // Kiểm tra danh mục tồn tại
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Không tìm thấy danh mục" });
        }

        const [products, totalProducts] = await Promise.all([
            Product.find({ category: categoryId })
                .populate('category', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Product.countDocuments({ category: categoryId })
        ]);

        const totalPages = Math.ceil(totalProducts / limit);

        return res.status(200).json({
            products,
            totalProducts,
            totalPages,
            currentPage: page,
            limit,
            category: { _id: category._id, name: category.name }
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy top 10 sản phẩm bán chạy nhất
const getTopBestSelling = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const products = await Product.find()
            .sort({ sold: -1 })
            .limit(limit)
            .populate('category', 'name');
        return res.status(200).json({ products, total: products.length });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy top 10 sản phẩm xem nhiều nhất
const getTopMostViewed = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const products = await Product.find()
            .sort({ views: -1 })
            .limit(limit)
            .populate('category', 'name');
        return res.status(200).json({ products, total: products.length });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Tìm kiếm và Lọc nâng cao với nhiều điều kiện lọc
const searchAndFilterProducts = async (req, res) => {
    try {
        const {
            query,
            category,
            minPrice,
            maxPrice,
            brand,
            color,
            storage,
            screenSize,
            operatingSystem,
            ram,
            rating,
            sortBy,
            order,
            page,
            limit,
            inStock,
            onSale,
            featured,
            tags
        } = req.query;

        let filter = {};

        // Lọc theo tên sản phẩm (tìm kiếm text)
        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { brand: { $regex: query, $options: 'i' } }
            ];
        }

        // Lọc theo danh mục (category param là slug string, không phải ObjectId)
        if (category) {
            const SLUG_MAP = {
                'dien-thoai': { name: 'Điện thoại' },
                'laptop':     { name: 'Laptop' },
                'phu-kien':   { name: 'Phụ kiện' },
            };
            const matcher = SLUG_MAP[category];
            if (matcher) {
                // Tìm category theo name (không phân biệt hoa thường)
                const cat = await Category.findOne({
                    name: { $regex: new RegExp(`^${matcher.name}$`, 'i') }
                });
                if (cat) {
                    filter.category = cat._id;
                } else {
                    // Thử tìm category gần đúng
                    const fuzzyCat = await Category.findOne({
                        name: { $regex: matcher.name, $options: 'i' }
                    });
                    if (fuzzyCat) {
                        filter.category = fuzzyCat._id;
                    } else {
                        return res.status(200).json({ products: [], total: 0, totalPages: 0, currentPage: 1 });
                    }
                }
            }
        }

        // Lọc theo thương hiệu
        if (brand) {
            const brands = brand.split(',').map(b => b.trim());
            filter.brand = { $regex: brands.join('|'), $options: 'i' };
        }

        // Lọc theo màu sắc
        if (color) {
            const colors = color.split(',').map(c => c.trim());
            filter.color = { $regex: colors.join('|'), $options: 'i' };
        }

        // Lọc theo dung lượng lưu trữ
        if (storage) {
            const storages = storage.split(',').map(s => s.trim());
            filter.storage = { $regex: storages.join('|'), $options: 'i' };
        }

        // Lọc theo kích thước màn hình
        if (screenSize) {
            filter.screenSize = { $regex: screenSize, $options: 'i' };
        }

        // Lọc theo hệ điều hành
        if (operatingSystem) {
            filter.operatingSystem = { $regex: operatingSystem, $options: 'i' };
        }

        // Lọc theo RAM
        if (ram) {
            filter.ram = { $regex: ram, $options: 'i' };
        }

        // Lọc theo đánh giá (rating >= giá trị)
        if (rating) {
            filter.rating = { $gte: Number(rating) };
        }

        // Lọc sản phẩm có trong kho
        if (inStock === 'true') {
            filter.stock = { $gt: 0 };
        }

        // Lọc sản phẩm đang khuyến mãi
        if (onSale === 'true') {
            filter.$and = filter.$and || [];
            filter.$and.push({
                $expr: { $lt: ['$promotionalPrice', '$price'] }
            });
        }

        // Lọc sản phẩm nổi bật
        if (featured === 'true') {
            filter.isFeatured = true;
        }

        // Lọc theo tags
        if (tags) {
            const tagList = tags.split(',').map(t => t.trim());
            filter.tags = { $in: tagList };
        }

        // Chỉ lấy sản phẩm active
        filter.isActive = { $ne: false };

        // Lọc theo khoảng giá (sử dụng promotionalPrice nếu có, ngược lại dùng price)
        // Sử dụng aggregation pipeline hoặc $where cho việc so sánh giá phức tạp
        if (minPrice || maxPrice) {
            filter.$and = filter.$and || [];
            const priceConditions = [];

            if (minPrice) {
                priceConditions.push({
                    $or: [
                        // Nếu có promotionalPrice, so sánh với promotionalPrice
                        {
                            $and: [
                                { promotionalPrice: { $ne: null } },
                                { $expr: { $gte: ['$promotionalPrice', Number(minPrice)] } }
                            ]
                        },
                        // Nếu không có promotionalPrice, so sánh với price
                        {
                            $and: [
                                { promotionalPrice: { $eq: null } },
                                { price: { $gte: Number(minPrice) } }
                            ]
                        }
                    ]
                });
            }

            if (maxPrice) {
                priceConditions.push({
                    $or: [
                        // Nếu có promotionalPrice, so sánh với promotionalPrice
                        {
                            $and: [
                                { promotionalPrice: { $ne: null } },
                                { $expr: { $lte: ['$promotionalPrice', Number(maxPrice)] } }
                            ]
                        },
                        // Nếu không có promotionalPrice, so sánh với price
                        {
                            $and: [
                                { promotionalPrice: { $eq: null } },
                                { price: { $lte: Number(maxPrice) } }
                            ]
                        }
                    ]
                });
            }

            filter.$and.push({ $or: priceConditions });
        }

        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 12;
        const skip = (pageNum - 1) * limitNum;

        // Xây dựng query với populate và sorting
        let queryBuilder = Product.find(filter)
            .populate('category', 'name');

        // Sort options
        let sortOptions = { createdAt: -1 }; // Mặc định: mới nhất
        if (sortBy) {
            switch (sortBy) {
                case 'price-asc':
                    sortOptions = { price: 1 };
                    break;
                case 'price-desc':
                    sortOptions = { price: -1 };
                    break;
                case 'name-asc':
                    sortOptions = { name: 1 };
                    break;
                case 'name-desc':
                    sortOptions = { name: -1 };
                    break;
                case 'rating':
                    sortOptions = { rating: -1 };
                    break;
                case 'best-selling':
                    sortOptions = { sold: -1 };
                    break;
                case 'most-viewed':
                    sortOptions = { views: -1 };
                    break;
                case 'newest':
                default:
                    sortOptions = { createdAt: -1 };
                    break;
            }
        }
        // Áp dụng order nếu có (asc/desc)
        if (order && ['asc', 'desc'].includes(order)) {
            const orderValue = order === 'asc' ? 1 : -1;
            sortOptions = Object.fromEntries(
                Object.entries(sortOptions).map(([k]) => [k, orderValue])
            );
        }

        queryBuilder = queryBuilder.sort(sortOptions).skip(skip).limit(limitNum);

        // Thực thi query song song với count
        const [products, totalProducts] = await Promise.all([
            queryBuilder.exec(),
            Product.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalProducts / limitNum);

        return res.status(200).json({
            products,
            total: totalProducts,
            totalPages,
            currentPage: pageNum,
            limit: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách brands có sẵn (để hiển thị trong filter)
const getAvailableBrands = async (req, res) => {
    try {
        const brands = await Product.distinct('brand', { brand: { $ne: '' } });
        return res.status(200).json(brands.filter(b => b).sort());
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách colors có sẵn (để hiển thị trong filter)
const getAvailableColors = async (req, res) => {
    try {
        const colors = await Product.distinct('color', { color: { $ne: '' } });
        return res.status(200).json(colors.filter(c => c).sort());
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách storages có sẵn (để hiển thị trong filter)
const getAvailableStorages = async (req, res) => {
    try {
        const storages = await Product.distinct('storage', { storage: { $ne: '' } });
        return res.status(200).json(storages.filter(s => s).sort());
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách rams có sẵn (để hiển thị trong filter)
const getAvailableRams = async (req, res) => {
    try {
        const rams = await Product.distinct('ram', { ram: { $ne: '' } });
        return res.status(200).json(rams.filter(r => r).sort());
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách operating systems có sẵn (để hiển thị trong filter)
const getAvailableOperatingSystems = async (req, res) => {
    try {
        const os = await Product.distinct('operatingSystem', { operatingSystem: { $ne: '' } });
        return res.status(200).json(os.filter(o => o).sort());
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy khoảng giá (min/max) để hiển thị range slider
const getPriceRange = async (req, res) => {
    try {
        const result = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ]);

        if (result.length === 0) {
            return res.status(200).json({ minPrice: 0, maxPrice: 100000000 });
        }

        return res.status(200).json({
            minPrice: result[0].minPrice,
            maxPrice: result[0].maxPrice
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy filter options động dựa trên category
const getFilterOptions = async (req, res) => {
    try {
        const { category } = req.query;
        let matchStage = { isActive: { $ne: false } };

        if (category) {
            const SLUG_MAP = {
                'dien-thoai': { name: 'Điện thoại' },
                'laptop':     { name: 'Laptop' },
                'phu-kien':   { name: 'Phụ kiện' },
            };
            const matcher = SLUG_MAP[category];
            if (matcher) {
                const cat = await Category.findOne({
                    name: { $regex: new RegExp(`^${matcher.name}$`, 'i') }
                });
                if (cat) {
                    matchStage.category = cat._id;
                } else {
                    const fuzzyCat = await Category.findOne({
                        name: { $regex: matcher.name, $options: 'i' }
                    });
                    if (fuzzyCat) {
                        matchStage.category = fuzzyCat._id;
                    }
                }
            }
        }

        const [brands, colors, storages, rams, operatingSystems, priceRange] = await Promise.all([
            Product.distinct('brand', { ...matchStage, brand: { $ne: '' } }),
            Product.distinct('color', { ...matchStage, color: { $ne: '' } }),
            Product.distinct('storage', { ...matchStage, storage: { $ne: '' } }),
            Product.distinct('ram', { ...matchStage, ram: { $ne: '' } }),
            Product.distinct('operatingSystem', { ...matchStage, operatingSystem: { $ne: '' } }),
            Product.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        minPrice: { $min: '$price' },
                        maxPrice: { $max: '$price' }
                    }
                }
            ])
        ]);

        return res.status(200).json({
            brands: brands.filter(b => b).sort(),
            colors: colors.filter(c => c).sort(),
            storages: storages.filter(s => s).sort(),
            rams: rams.filter(r => r).sort(),
            operatingSystems: operatingSystems.filter(o => o).sort(),
            priceRange: priceRange.length > 0
                ? { min: priceRange[0].minPrice, max: priceRange[0].maxPrice }
                : { min: 0, max: 100000000 }
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Tìm kiếm gợi ý (autocomplete)
const getSearchSuggestions = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) {
            return res.status(200).json([]);
        }

        const suggestions = await Product.find({
            name: { $regex: query, $options: 'i' },
            isActive: { $ne: false }
        })
        .select('name brand category')
        .populate('category', 'name')
        .limit(10);

        return res.status(200).json(suggestions);
    } catch (error) {
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy tất cả danh mục (Dùng cho dropdown/sidebar filter)
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        return res.status(200).json(categories);
    } catch (error) {
         return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
}
// Admin: Thêm sản phẩm
const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        return res.status(201).json({ message: "Tạo sản phẩm thành công", product });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi tạo sản phẩm", error: error.message });
    }
};

// Admin: Cập nhật sản phẩm (bao gồm cả update số lượng)
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
        if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        return res.status(200).json({ message: "Cập nhật thành công", product });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi cập nhật", error: error.message });
    }
};

// Admin: Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        return res.status(200).json({ message: "Xóa thành công", product });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi xóa", error: error.message });
    }
};

module.exports = {
    getHomepageProducts,
    getProductDetails,
    searchAndFilterProducts,
    getCategories,
    getProductsByCategory,
    getTopBestSelling,
    getTopMostViewed,
    createProduct,
    updateProduct,
    deleteProduct,
    getAvailableBrands,
    getAvailableColors,
    getAvailableStorages,
    getAvailableRams,
    getAvailableOperatingSystems,
    getPriceRange,
    getFilterOptions,
    getSearchSuggestions
};
