import React from 'react';
import { Link } from 'react-router-dom';
import { notification } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuth } from '../store/authSlice';
import { fetchCart } from '../store/cartSlice';
import axios from '../util/axios.customize';

const ProductCard = ({ product }) => {
    const dispatch = useDispatch();
    const auth = useSelector(selectAuth);
    const discount = product.promotionalPrice && product.price
        ? Math.round((1 - product.promotionalPrice / product.price) * 100)
        : 0;

    const finalPrice = product.promotionalPrice || product.price;

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!auth.isAuthenticated) {
            notification.warning({
                message: 'Vui lòng đăng nhập',
                description: 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng',
            });
            return;
        }

        if (product.stock === 0) {
            notification.info({
                message: 'Sản phẩm đã hết hàng',
            });
            return;
        }

        try {
            const res = await axios.post('/v1/api/cart/add', {
                productId: product._id,
                quantity: 1
            });
            if (res && res.cart) {
                notification.success({
                    message: 'Đã thêm vào giỏ hàng!',
                    description: product.name,
                    placement: 'bottomRight',
                });
                dispatch(fetchCart());
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
        }
    };

    return (
        <Link
            to={`/product/${product._id}`}
            style={{ textDecoration: 'none', display: 'flex', height: '100%' }}
        >
            <div className="product-card">
                <div className="product-badges">
                    {discount > 0 && (
                        <span className="badge badge-red">-{discount}%</span>
                    )}
                    {product.stock > 10 ? (
                        <span className="badge badge-green">Sẵn hàng</span>
                    ) : product.stock > 0 ? (
                        <span className="badge badge-orange">Sắp hết</span>
                    ) : (
                        <span className="badge badge-gray">Hết hàng</span>
                    )}
                </div>

                <div className="product-img-wrap">
                    <img
                        src={product.images && product.images.length > 0
                            ? product.images[0]
                            : 'https://via.placeholder.com/300'}
                        alt={product.name}
                        className="product-img"
                    />
                    {product.stock > 0 && auth.isAuthenticated && (
                        <button 
                            className="quick-add-btn"
                            onClick={handleAddToCart}
                        >
                            <ShoppingCartOutlined /> Thêm vào giỏ
                        </button>
                    )}
                </div>

                <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>

                    <div className="product-pricing">
                        <span className="product-price">
                            {finalPrice.toLocaleString('vi-VN')}₫
                        </span>
                        {product.promotionalPrice && (
                            <span className="product-price-old">
                                {product.price.toLocaleString('vi-VN')}₫
                            </span>
                        )}
                    </div>

                    <div className="product-tags">
                        <span className="tag tag-blue">Trả góp 0%</span>
                        {discount > 10 && <span className="tag tag-red">Giá sốc</span>}
                    </div>
                </div>
            </div>

            <style>{`
                .product-card {
                    background: #fff;
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid #f0f0f0;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    position: relative;
                    transition: box-shadow 0.3s ease, transform 0.3s ease;
                    cursor: pointer;
                }
                .product-card:hover {
                    box-shadow: 0 16px 48px rgba(0,0,0,0.12);
                    transform: translateY(-4px);
                }
                .product-badges {
                    position: absolute;
                    top: 12px; left: 12px;
                    display: flex; flex-direction: column; gap: 4px;
                    z-index: 2;
                }
                .badge {
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .badge-red    { background: #dc2626; color: #fff; }
                .badge-green  { background: #d1fae5; color: #065f46; }
                .badge-orange { background: #ffedd5; color: #92400e; }
                .badge-gray   { background: #f3f4f6; color: #374151; }

                .product-img-wrap {
                    background: #f9fafb;
                    aspect-ratio: 1;
                    overflow: hidden;
                    display: flex; align-items: center; justify-content: center;
                    position: relative;
                }
                .product-img {
                    width: 100%; height: 100%;
                    object-fit: contain;
                    transition: transform 0.5s ease;
                    padding: 16px;
                }
                .product-card:hover .product-img { transform: scale(1.07); }

                .quick-add-btn {
                    position: absolute;
                    bottom: 12px;
                    left: 50%;
                    transform: translateX(-50%) translateY(20px);
                    opacity: 0;
                    background: #2563eb;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    padding: 8px 16px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                    z-index: 3;
                }
                .product-card:hover .quick-add-btn {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                .quick-add-btn:hover {
                    background: #1d4ed8;
                }

                .product-info {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    flex: 1;
                }
                .product-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #111;
                    margin: 0;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    min-height: 40px;
                    transition: color 0.2s;
                }
                .product-card:hover .product-name { color: #2563eb; }
                .product-pricing {
                    display: flex; align-items: baseline; gap: 8px;
                }
                .product-price {
                    font-size: 16px;
                    font-weight: 700;
                    color: #dc2626;
                }
                .product-price-old {
                    font-size: 12px;
                    color: #9ca3af;
                    text-decoration: line-through;
                }
                .product-tags {
                    display: flex; flex-wrap: wrap; gap: 6px;
                    margin-top: auto;
                }
                .tag {
                    font-size: 10px;
                    font-weight: 600;
                    padding: 3px 8px;
                    border-radius: 6px;
                }
                .tag-blue { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
                .tag-red  { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }
            `}</style>
        </Link>
    );
};

export default ProductCard;
