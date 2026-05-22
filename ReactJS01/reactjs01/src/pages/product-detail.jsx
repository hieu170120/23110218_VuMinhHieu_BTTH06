import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../util/axios.customize';
import { Spin, notification, Button } from 'antd';
import {
    ShoppingCartOutlined, RightOutlined,
    SafetyCertificateOutlined, ReloadOutlined,
    CarOutlined, GiftOutlined,
    MinusOutlined, PlusOutlined,
    TagOutlined, InboxOutlined, FireOutlined,
    BarChartOutlined, EditOutlined,
} from '@ant-design/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';
import ProductCard from '../components/ProductCard';
import { AuthContext } from '../components/context/auth.context';
import { useCart } from '../components/context/cart.context';

/* ─── helpers ───────────────────────────────────────── */
const fmt = (n) => n?.toLocaleString('vi-VN') ?? '—';

const StockBadge = ({ stock }) => {
    if (stock > 10) return (
        <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700 }}>
            ✓ Còn hàng
        </span>
    );
    if (stock > 0) return (
        <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700 }}>
            ⚠ Sắp hết ({stock})
        </span>
    );
    return (
        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700 }}>
            ✕ Hết hàng
        </span>
    );
};

/* ─── Admin Stats Panel ──────────────────────────────── */
const AdminPanel = ({ product, onSaveSuccess }) => {
    const [editStock, setEditStock] = useState(product.stock);
    const [editSold, setEditSold] = useState(product.sold);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(`/v1/api/products/${product._id}`, {
                ...product,
                category: product.category._id || product.category,
                stock: editStock,
                sold: editSold
            });
            notification.success({ message: "Đã cập nhật tồn kho & số lượng bán" });
            if (onSaveSuccess) onSaveSuccess();
        } catch (e) {
            notification.error({ message: "Lỗi cập nhật", description: e.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            border: '2px dashed #f59e0b', borderRadius: '16px',
            padding: '20px 24px', background: '#fffbeb', marginBottom: '24px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <EditOutlined style={{ color: '#d97706' }} />
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#92400e', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Quản lý Admin
                    </span>
                </div>
                <Button 
                    type="primary" 
                    onClick={handleSave} 
                    loading={saving}
                    style={{ background: '#d97706', borderColor: '#d97706' }}
                    size="small"
                >
                    Lưu thay đổi
                </Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Tồn kho */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <InboxOutlined style={{ color: '#d97706' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Hàng tồn kho</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => setEditStock(s => Math.max(0, s - 1))} style={btnStyle('#fee2e2', '#dc2626')}>−</button>
                        <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 700, fontSize: '18px' }}>{editStock}</span>
                        <button onClick={() => setEditStock(s => s + 1)} style={btnStyle('#d1fae5', '#059669')}>+</button>
                    </div>
                </div>
                {/* Đã bán */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <BarChartOutlined style={{ color: '#d97706' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Đã bán</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => setEditSold(s => Math.max(0, s - 1))} style={btnStyle('#fee2e2', '#dc2626')}>−</button>
                        <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 700, fontSize: '18px' }}>{editSold}</span>
                        <button onClick={() => setEditSold(s => s + 1)} style={btnStyle('#d1fae5', '#059669')}>+</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const btnStyle = (bg, color) => ({
    width: '28px', height: '28px', borderRadius: '8px',
    border: 'none', background: bg, color, fontWeight: 700,
    cursor: 'pointer', fontSize: '16px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
});

/* ─── Main Component ──────────────────────────────────── */
const ProductDetail = () => {
    const { id } = useParams();
    const { auth } = useContext(AuthContext);
    const { fetchCart } = useCart();
    const isAdmin = auth?.user?.role === 'admin';

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [activeImg, setActiveImg] = useState(0);
    const [addLoading, setAddLoading] = useState(false);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/v1/api/products/${id}`);
            if (res?.product) { setData(res); setQuantity(1); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    const handleAddToCart = async () => {
        if (!auth.isAuthenticated) {
            notification.warning({
                message: 'Vui lòng đăng nhập',
                description: 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng',
            });
            return;
        }

        setAddLoading(true);
        try {
            const res = await axios.post('/v1/api/cart/add', {
                productId: id,
                quantity: quantity
            });
            if (res && res.cart) {
                notification.success({
                    message: 'Đã thêm vào giỏ hàng!',
                    description: `${quantity} × ${data.product.name}`,
                    placement: 'bottomRight',
                });
                fetchCart();
            } else if (res && res.message) {
                notification.error({
                    message: 'Lỗi',
                    description: res.message,
                });
            }
        } catch (error) {
            notification.error({
                message: 'Lỗi',
                description: 'Không thể thêm sản phẩm vào giỏ hàng',
            });
        } finally {
            setAddLoading(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <Spin size="large" />
        </div>
    );

    if (!data?.product) return (
        <div style={{ textAlign: 'center', padding: '120px 24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Sản phẩm không tồn tại</h2>
            <Link to="/" style={{ color: '#2563eb' }}>Về trang chủ</Link>
        </div>
    );

    const { product, similarProducts = [] } = data;
    const discount = product.promotionalPrice
        ? Math.round((1 - product.promotionalPrice / product.price) * 100)
        : 0;
    const images = product.images?.length > 0 ? product.images : [];

    return (
        <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>

            {/* ── Breadcrumb ─────────────────────────────── */}
            <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '14px 0' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9ca3af' }}>
                        <Link to="/" style={{ color: '#9ca3af', textDecoration: 'none' }} className="bc">Trang chủ</Link>
                        <RightOutlined style={{ fontSize: '9px' }} />
                        <Link
                            to={`/search?category=${product.category?.name?.toLowerCase()}`}
                            style={{ color: '#9ca3af', textDecoration: 'none' }}
                            className="bc"
                        >
                            {product.category?.name || 'Danh mục'}
                        </Link>
                        <RightOutlined style={{ fontSize: '9px' }} />
                        <span style={{ color: '#111', fontWeight: 600, maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.name}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Main Grid ──────────────────────────────── */}
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '80px' }}>

                    {/* ── LEFT: Image Gallery ─────────────── */}
                    <div style={{ position: 'sticky', top: '80px', alignSelf: 'flex-start' }}>
                        {images.length > 0 ? (
                            <>
                                {/* Main Swiper */}
                                <div style={{ borderRadius: '24px', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', marginBottom: '12px' }}>
                                    <Swiper
                                        modules={[Navigation, Pagination, Thumbs, FreeMode]}
                                        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                                        navigation
                                        pagination={{ clickable: true }}
                                        onSlideChange={s => setActiveImg(s.activeIndex)}
                                        style={{ width: '100%', aspectRatio: '1' }}
                                    >
                                        {images.map((img, i) => (
                                            <SwiperSlide key={i}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
                                                    <img src={img} alt={`${product.name} ${i + 1}`}
                                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                </div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>

                                {/* Thumb strip (chỉ hiện nếu > 1 ảnh) */}
                                {images.length > 1 && (
                                    <Swiper
                                        onSwiper={setThumbsSwiper}
                                        spaceBetween={10}
                                        slidesPerView={Math.min(images.length, 5)}
                                        freeMode
                                        watchSlidesProgress
                                        modules={[FreeMode, Thumbs]}
                                    >
                                        {images.map((img, i) => (
                                            <SwiperSlide key={i}>
                                                <div style={{
                                                    border: activeImg === i ? '2.5px solid #2563eb' : '2px solid #e5e7eb',
                                                    borderRadius: '12px', overflow: 'hidden',
                                                    background: '#fff', cursor: 'pointer',
                                                    transition: 'border-color 0.2s',
                                                    aspectRatio: '1',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px',
                                                }}>
                                                    <img src={img} alt="thumb" style={{ width: '100%', objectFit: 'contain' }} />
                                                </div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                )}

                                {/* Image count indicator */}
                                <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                                    {images.length} hình ảnh
                                </p>
                            </>
                        ) : (
                            <div style={{
                                aspectRatio: '1', background: '#f3f4f6', borderRadius: '24px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#9ca3af', fontSize: '16px',
                            }}>
                                Không có hình ảnh
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Product Info ─────────────── */}
                    <div>
                        {/* Admin Panel */}
                        {isAdmin && (
                            <AdminPanel product={product} onSaveSuccess={fetchProduct} />
                        )}

                        {/* Category badge */}
                        <Link
                            to={`/search?category=${product.category?.name?.toLowerCase()}`}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: '#eff6ff', color: '#2563eb',
                                padding: '5px 14px', borderRadius: '9999px',
                                fontSize: '12px', fontWeight: 700,
                                textDecoration: 'none', marginBottom: '16px',
                                border: '1px solid #bfdbfe',
                                transition: 'background 0.2s',
                            }}
                        >
                            <TagOutlined /> {product.category?.name || 'Danh mục'}
                        </Link>

                        {/* Title */}
                        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111', lineHeight: 1.2, margin: '0 0 16px', letterSpacing: '-0.5px' }}>
                            {product.name}
                        </h1>

                        {/* Stats row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            <StockBadge stock={product.stock} />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '13px' }}>
                                <FireOutlined style={{ color: '#ef4444' }} />
                                <span>Đã bán <strong style={{ color: '#111' }}>{fmt(product.sold)}</strong> sản phẩm</span>
                            </div>

                            {isAdmin && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '13px' }}>
                                    <InboxOutlined style={{ color: '#f59e0b' }} />
                                    <span>Tồn: <strong style={{ color: '#111' }}>{product.stock}</strong></span>
                                </div>
                            )}
                        </div>

                        {/* Price box */}
                        <div style={{
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            borderRadius: '20px', padding: '24px 28px', marginBottom: '28px',
                            border: '1px solid #bae6fd',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
                                {product.promotionalPrice ? (
                                    <>
                                        <span style={{ fontSize: '36px', fontWeight: 800, color: '#dc2626' }}>
                                            {fmt(product.promotionalPrice)}₫
                                        </span>
                                        <span style={{ fontSize: '20px', color: '#9ca3af', textDecoration: 'line-through' }}>
                                            {fmt(product.price)}₫
                                        </span>
                                        <span style={{
                                            background: '#dc2626', color: '#fff',
                                            fontSize: '12px', fontWeight: 700,
                                            padding: '3px 10px', borderRadius: '8px',
                                        }}>
                                            -{discount}%
                                        </span>
                                    </>
                                ) : (
                                    <span style={{ fontSize: '36px', fontWeight: 800, color: '#111' }}>
                                        {fmt(product.price)}₫
                                    </span>
                                )}
                            </div>
                            {product.promotionalPrice && (
                                <p style={{ color: '#0369a1', fontSize: '13px', margin: 0 }}>
                                    💰 Tiết kiệm {fmt(product.price - product.promotionalPrice)}₫ so với giá gốc
                                </p>
                            )}
                            <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0' }}>* Giá đã bao gồm thuế VAT</p>
                        </div>

                        {/* Quantity selector */}
                        {product.stock > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                                    Số lượng
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        disabled={quantity <= 1}
                                        style={{
                                            width: '44px', height: '44px',
                                            border: '1.5px solid #e5e7eb', borderRight: 'none',
                                            borderRadius: '12px 0 0 12px',
                                            background: quantity <= 1 ? '#f9fafb' : '#fff',
                                            cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                                            fontSize: '18px', color: quantity <= 1 ? '#d1d5db' : '#374151',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <MinusOutlined />
                                    </button>
                                    <div style={{
                                        width: '60px', height: '44px',
                                        border: '1.5px solid #e5e7eb',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '16px', fontWeight: 700, color: '#111',
                                    }}>
                                        {quantity}
                                    </div>
                                    <button
                                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                                        disabled={quantity >= product.stock}
                                        style={{
                                            width: '44px', height: '44px',
                                            border: '1.5px solid #e5e7eb', borderLeft: 'none',
                                            borderRadius: '0 12px 12px 0',
                                            background: quantity >= product.stock ? '#f9fafb' : '#fff',
                                            cursor: quantity >= product.stock ? 'not-allowed' : 'pointer',
                                            fontSize: '18px', color: quantity >= product.stock ? '#d1d5db' : '#374151',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <PlusOutlined />
                                    </button>
                                    <span style={{ marginLeft: '12px', fontSize: '13px', color: '#9ca3af' }}>
                                        Còn {product.stock} sản phẩm
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* CTA buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0 || addLoading}
                                style={{
                                    width: '100%', padding: '16px',
                                    background: product.stock === 0 ? '#e5e7eb' : '#2563eb',
                                    color: product.stock === 0 ? '#9ca3af' : '#fff',
                                    border: 'none', borderRadius: '14px',
                                    fontSize: '16px', fontWeight: 700,
                                    cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: product.stock > 0 ? '0 4px 20px rgba(37,99,235,0.3)' : 'none',
                                    transition: 'all 0.2s',
                                }}
                                className="buy-btn"
                            >
                                <ShoppingCartOutlined />
                                {addLoading ? 'Đang thêm...' : (product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng')}
                            </button>
                            <button
                                disabled={product.stock === 0}
                                style={{
                                    width: '100%', padding: '16px',
                                    background: '#fff',
                                    color: product.stock === 0 ? '#9ca3af' : '#2563eb',
                                    border: `2px solid ${product.stock === 0 ? '#e5e7eb' : '#2563eb'}`,
                                    borderRadius: '14px',
                                    fontSize: '16px', fontWeight: 700,
                                    cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Mua ngay · Trả góp 0%
                            </button>
                        </div>

                        {/* Benefits */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr',
                            gap: '12px', paddingTop: '24px',
                            borderTop: '1px solid #f0f0f0',
                        }}>
                            {[
                                { icon: <SafetyCertificateOutlined />, color: '#2563eb', bg: '#eff6ff', title: 'Bảo hành chính hãng', sub: '12 tháng tại TTBH ủy quyền' },
                                { icon: <ReloadOutlined />, color: '#059669', bg: '#ecfdf5', title: 'Đổi trả miễn phí', sub: 'Trong 30 ngày đầu' },
                                { icon: <CarOutlined />, color: '#7c3aed', bg: '#f5f3ff', title: 'Giao hàng nhanh', sub: 'Nhận hàng trong 2–4 giờ' },
                                { icon: <GiftOutlined />, color: '#dc2626', bg: '#fff1f2', title: 'Quà tặng hấp dẫn', sub: 'Khi mua kèm phụ kiện' },
                            ].map(({ icon, color, bg, title, sub }) => (
                                <div key={title} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: bg, color, flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '16px',
                                    }}>
                                        {icon}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#111' }}>{title}</p>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Description ──────────────────────────── */}
                <section style={{
                    background: '#fff', borderRadius: '24px',
                    padding: '48px', marginBottom: '64px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
                        Thông tin chi tiết
                    </h2>
                    <div style={{ width: '48px', height: '4px', background: '#2563eb', borderRadius: '4px', marginBottom: '28px' }} />
                    <div style={{ fontSize: '16px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                        {product.description}
                    </div>
                </section>

                {/* ── Similar Products ──────────────────────── */}
                {similarProducts.length > 0 && (
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                            <div>
                                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111', margin: 0 }}>
                                    Sản phẩm tương tự
                                </h2>
                                <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '14px' }}>
                                    Cùng danh mục <strong>{product.category?.name}</strong>
                                </p>
                            </div>
                            <Link
                                to={`/search?category=${product.category?.name?.toLowerCase()}`}
                                style={{
                                    color: '#2563eb', fontWeight: 700, fontSize: '14px',
                                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
                                }}
                            >
                                Xem tất cả <RightOutlined style={{ fontSize: '11px' }} />
                            </Link>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '20px',
                        }}>
                            {similarProducts.map(p => (
                                <ProductCard key={p._id} product={p} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <style>{`
                .bc:hover { color: #111 !important; }
                .buy-btn:hover:not(:disabled) { background: #1d4ed8 !important; transform: translateY(-1px); }
                @media (max-width: 768px) {
                    .product-grid { grid-template-columns: 1fr !important; }
                }
                .swiper-button-next, .swiper-button-prev {
                    color: #2563eb !important;
                    background: rgba(255,255,255,0.9);
                    width: 36px !important; height: 36px !important;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }
                .swiper-button-next::after, .swiper-button-prev::after {
                    font-size: 14px !important; font-weight: 900;
                }
                .swiper-pagination-bullet-active { background: #2563eb !important; }
            `}</style>
        </div>
    );
};

export default ProductDetail;
