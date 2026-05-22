const express = require('express');
const { 
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
} = require('../controllers/productController');

const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Routes Public (Không cần auth để xem)
router.get('/home', getHomepageProducts);
router.get('/search', searchAndFilterProducts);
router.get('/categories', getCategories);
router.get('/top-selling', getTopBestSelling);  // Top 10 bán chạy nhất
router.get('/top-viewed', getTopMostViewed);    // Top 10 xem nhiều nhất
router.get('/category/:categoryId', getProductsByCategory); // Sản phẩm theo danh mục (phân trang)
router.get('/:id', getProductDetails);

// Routes mới cho bộ lọc động
router.get('/filters/brands', getAvailableBrands);
router.get('/filters/colors', getAvailableColors);
router.get('/filters/storages', getAvailableStorages);
router.get('/filters/rams', getAvailableRams);
router.get('/filters/operating-systems', getAvailableOperatingSystems);
router.get('/filters/price-range', getPriceRange);
router.get('/filters/options', getFilterOptions);
router.get('/suggestions', getSearchSuggestions);

// Routes Protected (Cần quyền Admin)
router.post('/', auth, isAdmin, createProduct);
router.put('/:id', auth, isAdmin, updateProduct);
router.delete('/:id', auth, isAdmin, deleteProduct);

module.exports = router;
