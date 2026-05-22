import React, { useContext, useState } from 'react';
import { Table, Button, InputNumber, Popconfirm, message, Empty, Spin } from 'antd';
import { DeleteOutlined, ShoppingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/context/auth.context';
import { useCart } from '../components/context/cart.context';
import { addToCartApi, updateCartApi, removeFromCartApi, clearCartApi } from '../util/api';

const CartPage = () => {
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    const { cart, cartCount, fetchCart, setCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [buttonLoading, setButtonLoading] = useState({});

    if (!auth.isAuthenticated) {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
                <Empty description="Vui lòng đăng nhập để xem giỏ hàng" />
                <Button type="primary" onClick={() => navigate('/login')} style={{ marginTop: '20px' }}>
                    Đăng nhập
                </Button>
            </div>
        );
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    const handleUpdateQuantity = async (productId, quantity) => {
        if (quantity < 1) return;
        
        setButtonLoading(prev => ({ ...prev, [productId]: true }));
        try {
            const res = await updateCartApi(productId, quantity);
            if (res && res.cart) {
                setCart(res.cart);
                message.success('Cập nhật số lượng thành công');
            } else if (res && res.message) {
                message.error(res.message);
            }
        } catch (error) {
            message.error('Có lỗi xảy ra');
        } finally {
            setButtonLoading(prev => ({ ...prev, [productId]: false }));
        }
    };

    const handleRemoveItem = async (productId) => {
        setButtonLoading(prev => ({ ...prev, [`remove_${productId}`]: true }));
        try {
            const res = await removeFromCartApi(productId);
            if (res && res.cart) {
                setCart(res.cart);
                message.success('Đã xóa sản phẩm khỏi giỏ hàng');
            } else if (res && res.message) {
                message.error(res.message);
            }
        } catch (error) {
            message.error('Có lỗi xảy ra');
        } finally {
            setButtonLoading(prev => ({ ...prev, [`remove_${productId}`]: false }));
        }
    };

    const handleClearCart = async () => {
        setLoading(true);
        try {
            const res = await clearCartApi();
            if (res && res.cart) {
                setCart(res.cart);
                message.success('Đã xóa toàn bộ giỏ hàng');
            }
        } catch (error) {
            message.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    const columns = [
        {
            title: 'Sản phẩm',
            key: 'product',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img
                        src={record.image || 'https://via.placeholder.com/80'}
                        alt={record.name}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{record.name}</div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                            {record.product?.stock ? `Còn ${record.product.stock} sản phẩm` : ''}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Đơn giá',
            key: 'price',
            width: 150,
            render: (_, record) => {
                const price = record.promotionalPrice !== null ? record.promotionalPrice : record.price;
                const originalPrice = record.promotionalPrice !== null ? record.price : null;
                return (
                    <div>
                        <div style={{ fontWeight: 600, color: '#e63946' }}>{formatPrice(price)}</div>
                        {originalPrice && (
                            <div style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>
                                {formatPrice(originalPrice)}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Số lượng',
            key: 'quantity',
            width: 150,
            render: (_, record) => (
                <InputNumber
                    min={1}
                    max={record.product?.stock || 99}
                    value={record.quantity}
                    onChange={(value) => handleUpdateQuantity(record.product._id || record.product, value)}
                    loading={buttonLoading[record.product._id || record.product]}
                    style={{ width: '80px' }}
                />
            ),
        },
        {
            title: 'Thành tiền',
            key: 'total',
            width: 150,
            render: (_, record) => {
                const price = record.promotionalPrice !== null ? record.promotionalPrice : record.price;
                const total = price * record.quantity;
                return (
                    <div style={{ fontWeight: 600, color: '#e63946' }}>
                        {formatPrice(total)}
                    </div>
                );
            },
        },
        {
            title: '',
            key: 'action',
            width: 80,
            render: (_, record) => (
                <Popconfirm
                    title="Xóa sản phẩm"
                    description="Bạn có chắc muốn xóa sản phẩm này?"
                    onConfirm={() => handleRemoveItem(record.product._id || record.product)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        loading={buttonLoading[`remove_${record.product._id || record.product}`]}
                    />
                </Popconfirm>
            ),
        },
    ];

    const items = cart.items || [];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px' }}>
                Giỏ hàng của bạn ({cartCount} sản phẩm)
            </h1>

            {items.length === 0 ? (
                <Empty
                    image={<ShoppingOutlined style={{ fontSize: '80px', color: '#ccc' }} />}
                    description="Giỏ hàng trống"
                >
                    <Button type="primary" onClick={() => navigate('/')}>
                        Tiếp tục mua sắm
                    </Button>
                </Empty>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
                    <div>
                        <Table
                            dataSource={items}
                            columns={columns}
                            rowKey={(record) => record.product._id || record.product}
                            pagination={false}
                            loading={loading}
                            style={{ marginBottom: '24px' }}
                        />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ArrowLeftOutlined /> Tiếp tục mua sắm
                            </Link>
                            
                            <Popconfirm
                                title="Xóa toàn bộ giỏ hàng"
                                description="Bạn có chắc muốn xóa toàn bộ giỏ hàng?"
                                onConfirm={handleClearCart}
                                okText="Xóa tất cả"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                            >
                                <Button danger loading={loading}>
                                    Xóa toàn bộ giỏ hàng
                                </Button>
                            </Popconfirm>
                        </div>
                    </div>

                    <div style={{
                        background: '#f8f9fa',
                        padding: '24px',
                        borderRadius: '12px',
                        height: 'fit-content',
                        position: 'sticky',
                        top: '80px'
                    }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
                            Thông tin đơn hàng
                        </h2>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Tạm tính ({cartCount} sản phẩm)</span>
                                <span>{formatPrice(cart.totalAmount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Giảm giá</span>
                                <span style={{ color: '#22c55e' }}>0đ</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Phí vận chuyển</span>
                                <span style={{ color: '#22c55e' }}>Miễn phí</span>
                            </div>
                        </div>
                        
                        <div style={{
                            borderTop: '1px solid #e5e7eb',
                            paddingTop: '16px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700 }}>
                                <span>Tổng cộng</span>
                                <span style={{ color: '#e63946' }}>{formatPrice(cart.totalAmount)}</span>
                            </div>
                        </div>
                        
                        <Button
                            type="primary"
                            block
                            size="large"
                            onClick={handleCheckout}
                            style={{
                                height: '48px',
                                fontSize: '16px',
                                fontWeight: 600,
                                background: '#e63946',
                                borderColor: '#e63946'
                            }}
                        >
                            Thanh toán
                        </Button>
                        
                        <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '12px' }}>
                            Giá đã bao gồm VAT
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
