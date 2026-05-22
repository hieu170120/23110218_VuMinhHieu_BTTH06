import axios from './axios.customize';

const createUserApi = (name, email, password) => {
    const URL_API = "/v1/api/register";
    const data = {
        name, email, password
    }

    return axios.post(URL_API, data)
}

const loginApi = (email, password) => {
    const URL_API = "/v1/api/login";
    const data = {
        email, password
    }

    return axios.post(URL_API, data)
}

const getUserApi = () => {
    const URL_API = "/v1/api/user";
    return axios.get(URL_API)
}

// Cart APIs
const getCartApi = () => {
    const URL_API = "/v1/api/cart";
    return axios.get(URL_API)
}

const addToCartApi = (productId, quantity = 1) => {
    const URL_API = "/v1/api/cart/add";
    const data = { productId, quantity }
    return axios.post(URL_API, data)
}

const updateCartApi = (productId, quantity) => {
    const URL_API = "/v1/api/cart/update";
    const data = { productId, quantity }
    return axios.put(URL_API, data)
}

const removeFromCartApi = (productId) => {
    const URL_API = `/v1/api/cart/remove/${productId}`;
    return axios.delete(URL_API)
}

const clearCartApi = () => {
    const URL_API = "/v1/api/cart/clear";
    return axios.delete(URL_API)
}

// Order APIs
const createOrderApi = (orderData) => {
    const URL_API = "/v1/api/orders";
    return axios.post(URL_API, orderData)
}

const getOrdersApi = () => {
    const URL_API = "/v1/api/orders";
    return axios.get(URL_API)
}

const getOrderByIdApi = (orderId) => {
    const URL_API = `/v1/api/orders/${orderId}`;
    return axios.get(URL_API)
}

// User: Hủy đơn hàng (với lý do)
const cancelOrderApi = (orderId, reason = '') => {
    const URL_API = `/v1/api/orders/${orderId}/cancel`;
    return axios.put(URL_API, { reason })
}

// ============ ADMIN ORDER APIs ============

// Admin: Lấy tất cả đơn hàng (có phân trang, lọc, tìm kiếm)
const getAllOrdersAdminApi = (params = {}) => {
    const URL_API = "/v1/api/orders/admin/all";
    const queryParams = new URLSearchParams();

    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    return axios.get(queryString ? `${URL_API}?${queryString}` : URL_API);
};

// Admin: Lấy thống kê đơn hàng
const getOrderStatisticsApi = (params = {}) => {
    const URL_API = "/v1/api/orders/admin/statistics";
    const queryParams = new URLSearchParams();

    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    return axios.get(queryString ? `${URL_API}?${queryString}` : URL_API);
};

// Admin: Cập nhật trạng thái đơn hàng
const updateOrderStatusApi = (orderId, data) => {
    const URL_API = `/v1/api/orders/${orderId}/status`;
    return axios.put(URL_API, data);
};

// Admin: Xóa đơn hàng
const deleteOrderApi = (orderId) => {
    const URL_API = `/v1/api/orders/${orderId}`;
    return axios.delete(URL_API);
};

// Admin: Xử lý yêu cầu hủy đơn
const handleCancellationRequestApi = (orderId, action, reason = '') => {
    const URL_API = `/v1/api/orders/${orderId}/cancellation-request`;
    return axios.put(URL_API, { action, reason });
};

// ============ SEARCH & FILTER APIs ============

// API tìm kiếm và lọc sản phẩm nâng cao
const searchProductsApi = (params = {}) => {
    const URL_API = "/v1/api/products/search";
    const queryParams = new URLSearchParams();

    // Các tham số tìm kiếm
    if (params.query) queryParams.append('query', params.query);
    if (params.category) queryParams.append('category', params.category);

    // Các tham số lọc
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.brand) queryParams.append('brand', params.brand);
    if (params.color) queryParams.append('color', params.color);
    if (params.storage) queryParams.append('storage', params.storage);
    if (params.screenSize) queryParams.append('screenSize', params.screenSize);
    if (params.operatingSystem) queryParams.append('operatingSystem', params.operatingSystem);
    if (params.ram) queryParams.append('ram', params.ram);
    if (params.rating) queryParams.append('rating', params.rating);
    if (params.tags) queryParams.append('tags', params.tags);

    // Các tham số đặc biệt
    if (params.inStock) queryParams.append('inStock', 'true');
    if (params.onSale) queryParams.append('onSale', 'true');
    if (params.featured) queryParams.append('featured', 'true');

    // Phân trang và sắp xếp
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.order) queryParams.append('order', params.order);

    const queryString = queryParams.toString();
    return axios.get(queryString ? `${URL_API}?${queryString}` : URL_API);
};

// Lấy danh sách brands có sẵn
const getAvailableBrandsApi = () => {
    const URL_API = "/v1/api/products/filters/brands";
    return axios.get(URL_API);
};

// Lấy danh sách colors có sẵn
const getAvailableColorsApi = () => {
    const URL_API = "/v1/api/products/filters/colors";
    return axios.get(URL_API);
};

// Lấy danh sách storages có sẵn
const getAvailableStoragesApi = () => {
    const URL_API = "/v1/api/products/filters/storages";
    return axios.get(URL_API);
};

// Lấy danh sách rams có sẵn
const getAvailableRamsApi = () => {
    const URL_API = "/v1/api/products/filters/rams";
    return axios.get(URL_API);
};

// Lấy danh sách operating systems có sẵn
const getAvailableOperatingSystemsApi = () => {
    const URL_API = "/v1/api/products/filters/operating-systems";
    return axios.get(URL_API);
};

// Lấy khoảng giá (min/max)
const getPriceRangeApi = () => {
    const URL_API = "/v1/api/products/filters/price-range";
    return axios.get(URL_API);
};

// Lấy tất cả filter options (gộp)
const getFilterOptionsApi = (category = '') => {
    const URL_API = "/v1/api/products/filters/options";
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    const queryString = queryParams.toString();
    return axios.get(queryString ? `${URL_API}?${queryString}` : URL_API);
};

// Tìm kiếm gợi ý (autocomplete)
const getSearchSuggestionsApi = (query) => {
    const URL_API = "/v1/api/products/suggestions";
    const queryParams = new URLSearchParams();
    if (query) queryParams.append('query', query);
    return axios.get(`${URL_API}?${queryParams.toString()}`);
};

export {
    createUserApi, loginApi, getUserApi,
    getCartApi, addToCartApi, updateCartApi, removeFromCartApi, clearCartApi,
    createOrderApi, getOrdersApi, getOrderByIdApi, cancelOrderApi,
    getAllOrdersAdminApi, getOrderStatisticsApi, updateOrderStatusApi, deleteOrderApi, handleCancellationRequestApi,
    searchProductsApi, getAvailableBrandsApi, getAvailableColorsApi,
    getAvailableStoragesApi, getAvailableRamsApi, getAvailableOperatingSystemsApi,
    getPriceRangeApi, getFilterOptionsApi, getSearchSuggestionsApi
}