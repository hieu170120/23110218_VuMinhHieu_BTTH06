import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from '../util/axios.customize';
import ProductCard from '../components/ProductCard';
import {
    Spin, Input, Pagination, Slider, Checkbox, Rate, Tag, Empty,
    InputNumber, Collapse, Badge, Spin as LoadingIcon
} from 'antd';
import {
    SearchOutlined, RightOutlined, AppstoreOutlined, UnorderedListOutlined,
    FilterOutlined, CloseOutlined, StarOutlined, DownOutlined, UpOutlined,
    ThunderboltOutlined, FireOutlined, StarFilled, ShoppingOutlined
} from '@ant-design/icons';

const { Panel } = Collapse;

/* ─────────── Constants ─────────── */
const CATEGORIES = [
    { label: 'Điện thoại', value: 'dien-thoai', icon: '📱' },
    { label: 'Laptop', value: 'laptop', icon: '💻' },
    { label: 'Phụ kiện', value: 'phu-kien', icon: '🎧' },
];

const SORT_OPTIONS = [
    { label: 'Mới nhất', value: 'newest', icon: '🆕' },
    { label: 'Phổ biến nhất', value: 'best-selling', icon: '🔥' },
    { label: 'Đánh giá cao', value: 'rating', icon: '⭐' },
    { label: 'Giá: thấp → cao', value: 'price-asc', icon: '⬆️' },
    { label: 'Giá: cao → thấp', value: 'price-desc', icon: '⬇️' },
    { label: 'Xem nhiều', value: 'most-viewed', icon: '👁️' },
];

const PAGE_SIZE = 12;

/* ─────────── Sub-components ─────────── */

// Section wrapper cho bộ lọc
const FilterSection = ({ title, children, count, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div style={{ marginBottom: '24px' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    marginBottom: isOpen ? '14px' : 0,
                }}
            >
                <p style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '1.2px',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    {title}
                    {count !== undefined && (
                        <span style={{
                            fontSize: '10px',
                            background: '#f3f4f6',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            color: '#9ca3af'
                        }}>
                            {count}
                        </span>
                    )}
                </p>
                {isOpen ? <UpOutlined style={{ fontSize: '10px', color: '#9ca3af' }} /> :
                    <DownOutlined style={{ fontSize: '10px', color: '#9ca3af' }} />}
            </div>
            {isOpen && children}
        </div>
    );
};

// Chip cho active filter
const ActiveFilterChip = ({ label, onRemove }) => (
    <Tag
        closable
        onClose={onRemove}
        style={{
            margin: '4px',
            padding: '4px 8px',
            borderRadius: '16px',
            fontSize: '12px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        }}
        closeIcon={<CloseOutlined style={{ fontSize: '10px' }} />}
    >
        {label}
    </Tag>
);

// Quick filter button
const QuickFilterBtn = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '20px',
            border: active ? 'none' : '1.5px solid #e5e7eb',
            background: active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
            color: active ? '#fff' : '#6b7280',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: active ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
        }}
    >
        {icon} {label}
    </button>
);

// Empty state component
const EmptyState = ({ query, onReset }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        textAlign: 'center',
    }}>
        <div style={{ fontSize: '80px', marginBottom: '24px' }}>🔍</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111', margin: '0 0 12px' }}>
            Không tìm thấy sản phẩm
        </h2>
        <p style={{ color: '#6b7280', fontSize: '16px', maxWidth: '400px', lineHeight: 1.6, margin: '0 0 32px' }}>
            {query
                ? `Không có kết quả nào cho "${query}". Thử điều chỉnh bộ lọc hoặc từ khóa khác nhé!`
                : 'Chưa có sản phẩm nào phù hợp với bộ lọc hiện tại.'}
        </p>
        <button
            onClick={onReset}
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
            }}
        >
            Xóa bộ lọc
        </button>
    </div>
);

// List view card
const ListCard = ({ product }) => {
    const discount = product.promotionalPrice && product.price
        ? Math.round((1 - product.promotionalPrice / product.price) * 100)
        : 0;
    const finalPrice = product.promotionalPrice || product.price;

    return (
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
            <div style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                background: '#fff',
                borderRadius: '16px',
                padding: '16px 20px',
                border: '1.5px solid #f0f0f0',
                transition: 'all 0.2s',
            }}
                className="list-card"
            >
                <div style={{
                    width: '120px',
                    height: '120px',
                    flexShrink: 0,
                    background: '#f9fafb',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <img
                        src={product.images?.[0] || 'https://via.placeholder.com/120'}
                        alt={product.name}
                        style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                    />
                    {product.promotionalPrice && (
                        <span style={{
                            position: 'absolute',
                            top: '4px',
                            left: '4px',
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px'
                        }}>
                            -{discount}%
                        </span>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111',
                        margin: '0 0 8px',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {product.name}
                    </h3>

                    {product.brand && (
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }}>
                            {product.brand}
                        </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {product.rating > 0 && (
                            <Rate disabled value={product.rating} style={{ fontSize: '12px' }} />
                        )}
                        {product.numReviews > 0 && (
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                ({product.numReviews} đánh giá)
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>
                            {finalPrice.toLocaleString('vi-VN')}₫
                        </span>
                        {product.promotionalPrice && (
                            <span style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through' }}>
                                {product.price.toLocaleString('vi-VN')}₫
                            </span>
                        )}
                    </div>

                    {product.storage && (
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0' }}>
                            Bộ nhớ trong: {product.storage}
                        </p>
                    )}
                </div>

                <div style={{
                    padding: '10px 22px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 700,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                }}>
                    Xem ngay
                </div>
            </div>
        </Link>
    );
};

/* ─────────── Main Page ─────────── */
const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // URL params
    const urlQuery = searchParams.get('query') || '';
    const urlCategory = searchParams.get('category') || '';

    // States
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false
    });

    // Filter states
    const [searchInput, setSearchInput] = useState(urlQuery);
    const [selectedCategories, setSelectedCategories] = useState(
        urlCategory ? [urlCategory] : []
    );
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedStorages, setSelectedStorages] = useState([]);
    const [selectedRams, setSelectedRams] = useState([]);
    const [selectedOS, setSelectedOS] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 100000000]);
    const [priceRangeMax, setPriceRangeMax] = useState(100000000);
    const [selectedRating, setSelectedRating] = useState(0);

    // Quick filters
    const [inStockOnly, setInStockOnly] = useState(false);
    const [onSaleOnly, setOnSaleOnly] = useState(false);
    const [featuredOnly, setFeaturedOnly] = useState(false);

    // UI states
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Dynamic filter options
    const [filterOptions, setFilterOptions] = useState({
        brands: [],
        colors: [],
        storages: [],
        rams: [],
        operatingSystems: [],
        priceRange: { min: 0, max: 100000000 }
    });

    // Load filter options
    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                const urlCat = searchParams.get('category') || '';
                const res = await axios.get('/v1/api/products/filters/options', {
                    params: { category: urlCat }
                });

                // Axios interceptor returns response.data directly
                if (res && typeof res === 'object') {
                    setFilterOptions(res);
                    setPriceRangeMax(res.priceRange?.max || 100000000);
                    setPriceRange([0, res.priceRange?.max || 100000000]);
                }
            } catch (err) {
                console.error('Failed to load filter options:', err);
            }
        };
        loadFilterOptions();
    }, [searchParams]);

    // Debounced search suggestions
    useEffect(() => {
        if (searchInput.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await axios.get('/v1/api/products/suggestions', {
                    params: { query: searchInput }
                });
                // Axios interceptor returns response.data directly
                setSuggestions(Array.isArray(res) ? res : []);
                setShowSuggestions(true);
            } catch (err) {
                console.error('Suggestions error:', err);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    // Build filter params for API - read from URL directly to avoid stale state
    const buildFilterParams = useCallback(() => {
        // Read category from URL directly
        const urlCat = searchParams.get('category') || '';
        const urlQuery = searchParams.get('query') || '';

        const params = {
            page: currentPage,
            limit: PAGE_SIZE,
            sortBy: sortBy,
        };

        if (urlQuery) params.query = urlQuery;
        if (urlCat) params.category = urlCat;
        if (selectedBrands.length > 0) params.brand = selectedBrands.join(',');
        if (selectedColors.length > 0) params.color = selectedColors.join(',');
        if (selectedStorages.length > 0) params.storage = selectedStorages.join(',');
        if (selectedRams.length > 0) params.ram = selectedRams.join(',');
        if (selectedOS.length > 0) params.operatingSystem = selectedOS.join(',');
        if (priceRange[0] > 0) params.minPrice = priceRange[0];
        if (priceRange[1] < priceRangeMax) params.maxPrice = priceRange[1];
        if (selectedRating > 0) params.rating = selectedRating;
        if (inStockOnly) params.inStock = 'true';
        if (onSaleOnly) params.onSale = 'true';
        if (featuredOnly) params.featured = 'true';

        return params;
    }, [
        currentPage, sortBy, searchParams, // Use searchParams instead of selectedCategories
        selectedBrands, selectedColors, selectedStorages, selectedRams, selectedOS,
        priceRange, priceRangeMax, selectedRating, inStockOnly, onSaleOnly, featuredOnly
    ]);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = buildFilterParams();
                const res = await axios.get('/v1/api/products/search', { params });

                // Axios interceptor returns response.data, so res is already the data object
                if (res) {
                    if (Array.isArray(res)) {
                        // Legacy response format: array of products
                        setProducts(res);
                        setPagination(prev => ({ ...prev, total: res.length }));
                    } else {
                        // New response format: { products, total, ... }
                        setProducts(res.products || []);
                        setPagination({
                            total: res.total || 0,
                            totalPages: res.totalPages || 0,
                            currentPage: res.currentPage || 1,
                            hasNextPage: res.hasNextPage || false,
                            hasPrevPage: res.hasPrevPage || false
                        });
                    }
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setProducts([]);
                setPagination(prev => ({ ...prev, total: 0 }));
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [buildFilterParams]);

    // Sync URL params when URL changes (e.g., navigating from header)
    useEffect(() => {
        setSelectedCategories(urlCategory ? [urlCategory] : []);
        setCurrentPage(1);
    }, [urlCategory]);

    // Sync search input from URL
    useEffect(() => {
        setSearchInput(urlQuery);
    }, [urlQuery]);

    // Handlers
    const handleSearchSubmit = (value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set('query', value);
        } else {
            newParams.delete('query');
        }
        setSearchParams(newParams);
        setSearchInput(value);
        setCurrentPage(1);
        setShowSuggestions(false);
    };

    const handleSuggestionClick = (product) => {
        navigate(`/product/${product._id}`);
        setShowSuggestions(false);
    };

    const toggleCategory = (val) => {
        if (selectedCategories.includes(val)) {
            setSelectedCategories([]);
            // Remove category from URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('category');
            setSearchParams(newParams);
        } else {
            setSelectedCategories([val]);
            // Add category to URL
            const newParams = new URLSearchParams(searchParams);
            newParams.set('category', val);
            setSearchParams(newParams);
        }
        setCurrentPage(1);
    };

    const toggleMultiSelect = (value, selectedList, setSelectedList) => {
        if (selectedList.includes(value)) {
            setSelectedList(selectedList.filter(v => v !== value));
        } else {
            setSelectedList([...selectedList, value]);
        }
        setCurrentPage(1);
    };

    const resetAllFilters = () => {
        setSearchInput('');
        setSelectedCategories([]);
        setSelectedBrands([]);
        setSelectedColors([]);
        setSelectedStorages([]);
        setSelectedRams([]);
        setSelectedOS([]);
        setPriceRange([0, priceRangeMax]);
        setSelectedRating(0);
        setInStockOnly(false);
        setOnSaleOnly(false);
        setFeaturedOnly(false);
        setSortBy('newest');
        setCurrentPage(1);
        setSearchParams({});
    };

    const removeFilter = (type, value) => {
        switch (type) {
            case 'category':
                setSelectedCategories([]);
                break;
            case 'brand':
                setSelectedBrands(prev => prev.filter(v => v !== value));
                break;
            case 'color':
                setSelectedColors(prev => prev.filter(v => v !== value));
                break;
            case 'storage':
                setSelectedStorages(prev => prev.filter(v => v !== value));
                break;
            case 'ram':
                setSelectedRams(prev => prev.filter(v => v !== value));
                break;
            case 'os':
                setSelectedOS(prev => prev.filter(v => v !== value));
                break;
            case 'rating':
                setSelectedRating(0);
                break;
            case 'quick':
                if (value === 'inStock') setInStockOnly(false);
                if (value === 'onSale') setOnSaleOnly(false);
                if (value === 'featured') setFeaturedOnly(false);
                break;
        }
        setCurrentPage(1);
    };

    // Active filters summary
    const activeFilters = useMemo(() => {
        const filters = [];

        selectedCategories.forEach(cat => {
            const c = CATEGORIES.find(c => c.value === cat);
            filters.push({ type: 'category', value: cat, label: c?.label || cat });
        });

        selectedBrands.forEach(brand => {
            filters.push({ type: 'brand', value: brand, label: brand });
        });

        selectedColors.forEach(color => {
            filters.push({ type: 'color', value: color, label: color });
        });

        selectedStorages.forEach(storage => {
            filters.push({ type: 'storage', value: storage, label: storage });
        });

        selectedRams.forEach(ram => {
            filters.push({ type: 'ram', value: ram, label: ram });
        });

        selectedOS.forEach(os => {
            filters.push({ type: 'os', value: os, label: os });
        });

        if (selectedRating > 0) {
            filters.push({ type: 'rating', value: selectedRating, label: `${selectedRating}⭐ trở lên` });
        }

        if (priceRange[0] > 0 || priceRange[1] < priceRangeMax) {
            filters.push({
                type: 'price',
                value: 'price',
                label: `${priceRange[0] / 1000000}tr - ${priceRange[1] / 1000000}tr`
            });
        }

        if (inStockOnly) filters.push({ type: 'quick', value: 'inStock', label: 'Còn hàng' });
        if (onSaleOnly) filters.push({ type: 'quick', value: 'onSale', label: 'Đang giảm giá' });
        if (featuredOnly) filters.push({ type: 'quick', value: 'featured', label: 'Nổi bật' });

        return filters;
    }, [
        selectedCategories, selectedBrands, selectedColors, selectedStorages,
        selectedRams, selectedOS, selectedRating, priceRange, priceRangeMax,
        inStockOnly, onSaleOnly, featuredOnly
    ]);

    // Pagination slice
    const paginated = products;

    // Format price for display
    const formatPrice = (price) => {
        if (price >= 1000000) {
            return `${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)} triệu`;
        }
        return price.toLocaleString('vi-VN') + '₫';
    };

    /* ─────────── Render ─────────── */
    return (
        <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>
            {/* ── TOP SEARCH BAR ────────────────────────────── */}
            <div style={{
                background: '#fff',
                borderBottom: '1px solid #f0f0f0',
                padding: '24px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Breadcrumb */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#9ca3af',
                        marginBottom: '16px'
                    }}>
                        <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none' }} className="bc-link">
                            Trang chủ
                        </Link>
                        <RightOutlined style={{ fontSize: '9px' }} />
                        <span style={{ color: '#111', fontWeight: 600 }}>Tìm kiếm sản phẩm</span>
                    </div>

                    {/* Search input with suggestions */}
                    <div style={{ position: 'relative', maxWidth: '700px' }}>
                        <Input
                            size="large"
                            placeholder="Tìm kiếm sản phẩm..."
                            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSearchSubmit(searchInput);
                                if (e.key === 'Escape') setShowSuggestions(false);
                            }}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            style={{
                                borderRadius: '14px',
                                fontSize: '15px',
                                border: '2px solid #e5e7eb',
                                boxShadow: 'none',
                                padding: '10px 18px',
                            }}
                            allowClear
                            onClear={() => handleSearchSubmit('')}
                        />

                        {/* Search suggestions dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: '#fff',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                border: '1px solid #f0f0f0',
                                zIndex: 1000,
                                marginTop: '8px',
                                overflow: 'hidden'
                            }}>
                                {suggestions.map((product, idx) => (
                                    <div
                                        key={product._id || idx}
                                        onClick={() => handleSuggestionClick(product)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s'
                                        }}
                                        className="suggestion-item"
                                    >
                                        <img
                                            src={product.images?.[0] || 'https://via.placeholder.com/40'}
                                            alt=""
                                            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 500, color: '#111' }}>{product.name}</p>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{product.brand}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Results count */}
                    <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>
                        {loading ? (
                            <Spin size="small" />
                        ) : (
                            <>
                                Tìm thấy <strong style={{ color: '#2563eb' }}>{pagination.total}</strong> sản phẩm
                                {(searchInput || selectedCategories.length > 0) && (
                                    <> cho <strong style={{ color: '#111' }}>"{searchInput || selectedCategories[0]}"</strong></>
                                )}
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* ── MAIN CONTENT ──────────────────────────────── */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px', display: 'flex', gap: '24px' }}>

                {/* ── SIDEBAR ─────────────────────────────────── */}
                <aside style={{
                    width: '280px',
                    flexShrink: 0,
                    background: '#fff',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                    position: 'sticky',
                    top: '140px',
                    maxHeight: 'calc(100vh - 160px)',
                    overflowY: 'auto',
                }}
                    className="filter-sidebar"
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '20px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid #f0f0f0'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111' }}>
                            <FilterOutlined style={{ marginRight: '8px' }} />
                            Bộ lọc
                        </h3>
                        {activeFilters.length > 0 && (
                            <button
                                onClick={resetAllFilters}
                                style={{
                                    fontSize: '12px',
                                    color: '#ef4444',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Xóa tất cả
                            </button>
                        )}
                    </div>

                    {/* Quick Filters */}
                    <FilterSection title="Lọc nhanh">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <QuickFilterBtn
                                icon={<ShoppingOutlined />}
                                label="Còn hàng"
                                active={inStockOnly}
                                onClick={() => { setInStockOnly(!inStockOnly); setCurrentPage(1); }}
                            />
                            <QuickFilterBtn
                                icon={<ThunderboltOutlined />}
                                label="Đang giảm giá"
                                active={onSaleOnly}
                                onClick={() => { setOnSaleOnly(!onSaleOnly); setCurrentPage(1); }}
                            />
                            <QuickFilterBtn
                                icon={<StarOutlined />}
                                label="Nổi bật"
                                active={featuredOnly}
                                onClick={() => { setFeaturedOnly(!featuredOnly); setCurrentPage(1); }}
                            />
                        </div>
                    </FilterSection>

                    {/* Danh mục */}
                    <FilterSection title="Danh mục">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {CATEGORIES.map(({ label, value, icon }) => {
                                const checked = selectedCategories.includes(value);
                                return (
                                    <label
                                        key={value}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: checked ? 600 : 400,
                                            color: checked ? '#667eea' : '#374151',
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            background: checked ? '#f0f1ff' : 'transparent',
                                            transition: 'all 0.15s'
                                        }}
                                        onClick={() => toggleCategory(value)}
                                    >
                                        <span style={{ fontSize: '16px' }}>{icon}</span>
                                        {label}
                                    </label>
                                );
                            })}
                        </div>
                    </FilterSection>

                    {/* Khoảng giá */}
                    <FilterSection title="Khoảng giá">
                        <div style={{ padding: '0 8px' }}>
                            <Slider
                                range
                                min={0}
                                max={priceRangeMax}
                                value={priceRange}
                                onChange={val => { setPriceRange(val); setCurrentPage(1); }}
                                tooltipFormatter={formatPrice}
                                marks={{
                                    0: '0',
                                    [priceRangeMax / 2]: formatPrice(priceRangeMax / 2),
                                    [priceRangeMax]: formatPrice(priceRangeMax)
                                }}
                                styles={{
                                    track: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                                    rail: { background: '#e5e7eb' }
                                }}
                            />
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '12px',
                                color: '#6b7280',
                                marginTop: '8px'
                            }}>
                                <span>Từ: <strong>{formatPrice(priceRange[0])}</strong></span>
                                <span>Đến: <strong>{formatPrice(priceRange[1])}</strong></span>
                            </div>
                        </div>
                    </FilterSection>

                    {/* Thương hiệu */}
                    {filterOptions.brands.length > 0 && (
                        <FilterSection title="Thương hiệu" count={filterOptions.brands.length}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                                {filterOptions.brands.map(brand => {
                                    const checked = selectedBrands.includes(brand);
                                    return (
                                        <Checkbox
                                            key={brand}
                                            checked={checked}
                                            onChange={() => toggleMultiSelect(brand, selectedBrands, setSelectedBrands)}
                                            style={{ fontSize: '13px' }}
                                        >
                                            {brand}
                                        </Checkbox>
                                    );
                                })}
                            </div>
                        </FilterSection>
                    )}

                    {/* Dung lượng lưu trữ */}
                    {filterOptions.storages.length > 0 && (
                        <FilterSection title="Dung lượng" count={filterOptions.storages.length}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {filterOptions.storages.map(storage => {
                                    const active = selectedStorages.includes(storage);
                                    return (
                                        <button
                                            key={storage}
                                            onClick={() => toggleMultiSelect(storage, selectedStorages, setSelectedStorages)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: active ? 'none' : '1.5px solid #e5e7eb',
                                                background: active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                                                color: active ? '#fff' : '#374151',
                                                fontSize: '12px',
                                                fontWeight: active ? 700 : 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {storage}
                                        </button>
                                    );
                                })}
                            </div>
                        </FilterSection>
                    )}

                    {/* RAM */}
                    {filterOptions.rams.length > 0 && (
                        <FilterSection title="RAM" count={filterOptions.rams.length}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {filterOptions.rams.map(ram => {
                                    const active = selectedRams.includes(ram);
                                    return (
                                        <button
                                            key={ram}
                                            onClick={() => toggleMultiSelect(ram, selectedRams, setSelectedRams)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: active ? 'none' : '1.5px solid #e5e7eb',
                                                background: active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                                                color: active ? '#fff' : '#374151',
                                                fontSize: '12px',
                                                fontWeight: active ? 700 : 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {ram}
                                        </button>
                                    );
                                })}
                            </div>
                        </FilterSection>
                    )}

                    {/* Hệ điều hành */}
                    {filterOptions.operatingSystems.length > 0 && (
                        <FilterSection title="Hệ điều hành" count={filterOptions.operatingSystems.length}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {filterOptions.operatingSystems.map(os => {
                                    const checked = selectedOS.includes(os);
                                    return (
                                        <Checkbox
                                            key={os}
                                            checked={checked}
                                            onChange={() => toggleMultiSelect(os, selectedOS, setSelectedOS)}
                                            style={{ fontSize: '13px' }}
                                        >
                                            {os}
                                        </Checkbox>
                                    );
                                })}
                            </div>
                        </FilterSection>
                    )}

                    {/* Màu sắc */}
                    {filterOptions.colors.length > 0 && (
                        <FilterSection title="Màu sắc" count={filterOptions.colors.length}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {filterOptions.colors.map(color => {
                                    const active = selectedColors.includes(color);
                                    return (
                                        <button
                                            key={color}
                                            onClick={() => toggleMultiSelect(color, selectedColors, setSelectedColors)}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                border: active ? '2px solid #667eea' : '1.5px solid #e5e7eb',
                                                background: active ? '#f0f1ff' : '#fff',
                                                color: active ? '#667eea' : '#374151',
                                                fontSize: '12px',
                                                fontWeight: active ? 700 : 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {color}
                                        </button>
                                    );
                                })}
                            </div>
                        </FilterSection>
                    )}

                    {/* Đánh giá */}
                    <FilterSection title="Đánh giá">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[4, 3, 2, 1].map(star => (
                                <label
                                    key={star}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px'
                                    }}
                                    onClick={() => { setSelectedRating(selectedRating === star ? 0 : star); setCurrentPage(1); }}
                                >
                                    <input
                                        type="radio"
                                        checked={selectedRating === star}
                                        onChange={() => {}}
                                        style={{ accentColor: '#f59e0b' }}
                                    />
                                    <Rate disabled value={star} style={{ fontSize: '12px' }} />
                                    <span style={{ color: '#6b7280' }}>trở lên</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>
                </aside>

                {/* ── MAIN CONTENT AREA ────────────────────────── */}
                <main style={{ flex: 1, minWidth: 0 }}>
                    {/* Sort bar + active filters */}
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        marginBottom: '20px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                    }}>
                        {/* Sort options */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                            marginBottom: activeFilters.length > 0 ? '16px' : 0
                        }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {SORT_OPTIONS.map(({ label, value, icon }) => {
                                    const active = sortBy === value;
                                    return (
                                        <button
                                            key={value}
                                            onClick={() => { setSortBy(value); setCurrentPage(1); }}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                border: active ? 'none' : '1.5px solid #e5e7eb',
                                                background: active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                                                color: active ? '#fff' : '#374151',
                                                fontSize: '12px',
                                                fontWeight: active ? 700 : 500,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                transition: 'all 0.2s',
                                                boxShadow: active ? '0 4px 12px rgba(102, 126, 234, 0.25)' : 'none'
                                            }}
                                        >
                                            {icon} {label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* View toggle */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {[
                                    { mode: 'grid', Icon: AppstoreOutlined },
                                    { mode: 'list', Icon: UnorderedListOutlined },
                                ].map(({ mode, Icon }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            border: viewMode === mode ? 'none' : '1.5px solid #e5e7eb',
                                            background: viewMode === mode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                                            color: viewMode === mode ? '#fff' : '#9ca3af',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Icon />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Active filters display */}
                        {activeFilters.length > 0 && (
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: '8px',
                                paddingTop: '12px',
                                borderTop: '1px solid #f0f0f0'
                            }}>
                                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
                                    Đang lọc:
                                </span>
                                {activeFilters.map((filter, idx) => (
                                    <ActiveFilterChip
                                        key={`${filter.type}-${filter.value}`}
                                        label={filter.label}
                                        onRemove={() => removeFilter(filter.type, filter.value)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Products */}
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '400px',
                            background: '#fff',
                            borderRadius: '16px'
                        }}>
                            <Spin size="large" />
                        </div>
                    ) : paginated.length === 0 ? (
                        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden' }}>
                            <EmptyState
                                query={searchInput || selectedCategories[0]}
                                onReset={resetAllFilters}
                            />
                        </div>
                    ) : (
                        <>
                            <div style={
                                viewMode === 'grid'
                                    ? {
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                        gap: '20px'
                                    }
                                    : {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }
                            }>
                                {paginated.map(p => (
                                    viewMode === 'grid'
                                        ? <ProductCard key={p._id} product={p} />
                                        : <ListCard key={p._id} product={p} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginTop: '48px'
                                }}>
                                    <Pagination
                                        current={pagination.currentPage}
                                        total={pagination.total}
                                        pageSize={PAGE_SIZE}
                                        onChange={(page) => setCurrentPage(page)}
                                        showSizeChanger={false}
                                        showTotal={(total, range) =>
                                            `${range[0]}-${range[1]} của ${total} sản phẩm`
                                        }
                                        style={{ marginTop: '24px' }}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* ── STYLES ─────────────────────────────────── */}
            <style>{`
                .bc-link:hover { color: #111 !important; }
                .suggestion-item:hover { background: #f9fafb; }
                .list-card:hover {
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                    border-color: #e5e7eb;
                }
                .filter-sidebar::-webkit-scrollbar { width: 4px; }
                .filter-sidebar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

                @media (max-width: 768px) {
                    .filter-sidebar { display: none; }
                }
            `}</style>
        </div>
    );
};

export default SearchPage;
