import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Radio, Divider, Card, Row, Col, Spin } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, UserOutlined, CreditCardOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuth } from '../store/authSlice';
import { selectCart, setCart } from '../store/cartSlice';
import { createOrderApi } from '../util/api';

const { TextArea } = Input;

const CheckoutPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const auth = useSelector(selectAuth);
    const cart = useSelector(selectCart);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('COD');

    useEffect(() => {
        if (!auth.isAuthenticated) {
            message.warning('Vui lòng đăng nhập để thanh toán');
            navigate('/login');
        }
    }, [auth.isAuthenticated, navigate]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    const items = cart?.items || [];

    const onFinish = async (values) => {
        if (items.length === 0) {
            message.error('Giỏ hàng trống');
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                shippingAddress: {
                    fullName: values.fullName,
                    phone: values.phone,
                    address: values.address,
                    city: values.city || 'TP. Hồ Chí Minh',
                    district: values.district || '',
                    ward: values.ward || '',
                    note: values.note || ''
                },
                paymentMethod,
                note: values.note || ''
            };

            const res = await createOrderApi(orderData);

            if (res && res.order) {
                dispatch(setCart({ items: [], totalAmount: 0 }));
                message.success('Đặt hàng thành công!');
                navigate('/order-success', { state: { order: res.order } });
            } else if (res && res.message) {
                message.error(res.message);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            message.error('Có lỗi xảy ra khi đặt hàng');
        } finally {
            setLoading(false);
        }
    };

    if (!auth.isAuthenticated) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px' }}>
                Thanh toán đơn hàng
            </h1>

            <Row gutter={[24, 24]}>
                {/* Thông tin giao hàng */}
                <Col xs={24} lg={14}>
                    <Card 
                        title={
                            <span>
                                <EnvironmentOutlined /> Thông tin giao hàng
                            </span>
                        }
                        style={{ marginBottom: '24px' }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            initialValues={{
                                fullName: auth.user?.name || '',
                                city: 'TP. Hồ Chí Minh'
                            }}
                        >
                            <Form.Item
                                label="Họ và tên"
                                name="fullName"
                                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                            >
                                <Input 
                                    prefix={<UserOutlined />} 
                                    placeholder="Nhập họ và tên người nhận" 
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Số điện thoại"
                                name="phone"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                                ]}
                            >
                                <Input 
                                    prefix={<PhoneOutlined />} 
                                    placeholder="Nhập số điện thoại liên hệ" 
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Địa chỉ"
                                name="address"
                                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ giao hàng' }]}
                            >
                                <Input 
                                    placeholder="Số nhà, tên đường" 
                                    size="large"
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Tỉnh/Thành phố" name="city">
                                        <Input size="large" placeholder="TP. Hồ Chí Minh" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Quận/Huyện" name="district">
                                        <Input size="large" placeholder="Quận/Huyện" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Phường/Xã" name="ward">
                                        <Input size="large" placeholder="Phường/Xã" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                label="Ghi chú"
                                name="note"
                            >
                                <TextArea 
                                    rows={3} 
                                    placeholder="Ghi chú cho đơn hàng (nếu có)" 
                                />
                            </Form.Item>
                        </Form>
                    </Card>

                    {/* Phương thức thanh toán */}
                    <Card 
                        title={
                            <span>
                                <CreditCardOutlined /> Phương thức thanh toán
                            </span>
                        }
                    >
                        <Radio.Group 
                            value={paymentMethod} 
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <Card 
                                hoverable
                                style={{ 
                                    marginBottom: 12, 
                                    border: paymentMethod === 'COD' ? '2px solid #e63946' : '1px solid #e5e7eb',
                                    background: paymentMethod === 'COD' ? '#fef2f2' : '#fff'
                                }}
                            >
                                <Radio value="COD">
                                    <span style={{ fontWeight: 600 }}>Thanh toán khi nhận hàng (COD)</span>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                        Trả tiền mặt khi nhận được hàng
                                    </div>
                                </Radio>
                            </Card>
                            <Card 
                                hoverable
                                style={{ 
                                    marginBottom: 12, 
                                    border: paymentMethod === 'VNPAY' ? '2px solid #e63946' : '1px solid #e5e7eb',
                                    background: paymentMethod === 'VNPAY' ? '#fef2f2' : '#f5f5f5',
                                    opacity: 0.6
                                }}
                            >
                                <Radio value="VNPAY" disabled>
                                    <span style={{ fontWeight: 600 }}>VNPAY</span>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                        Thanh toán qua ví VNPay (sắp ra mắt)
                                    </div>
                                </Radio>
                            </Card>
                            <Card 
                                hoverable
                                style={{ 
                                    border: paymentMethod === 'MOMO' ? '2px solid #e63946' : '1px solid #e5e7eb',
                                    background: paymentMethod === 'MOMO' ? '#fef2f2' : '#f5f5f5',
                                    opacity: 0.6
                                }}
                            >
                                <Radio value="MOMO" disabled>
                                    <span style={{ fontWeight: 600 }}>MoMo</span>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                        Thanh toán qua ví MoMo (sắp ra mắt)
                                    </div>
                                </Radio>
                            </Card>
                        </Radio.Group>
                    </Card>
                </Col>

                {/* Thông tin đơn hàng */}
                <Col xs={24} lg={10}>
                    <Card 
                        title="Đơn hàng của bạn"
                        style={{ position: 'sticky', top: '80px' }}
                    >
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                            {items.map((item, index) => {
                                const price = item.promotionalPrice !== null ? item.promotionalPrice : item.price;
                                return (
                                    <div 
                                        key={index}
                                        style={{ 
                                            display: 'flex', 
                                            gap: '12px', 
                                            padding: '12px 0',
                                            borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none'
                                        }}
                                    >
                                        <img 
                                            src={item.image || 'https://via.placeholder.com/60'} 
                                            alt={item.name}
                                            style={{ 
                                                width: '60px', 
                                                height: '60px', 
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>x{item.quantity}</div>
                                            <div style={{ fontWeight: 600, color: '#e63946', fontSize: '14px' }}>
                                                {formatPrice(price * item.quantity)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Tạm tính ({items.length} sản phẩm)</span>
                                <span>{formatPrice(cart.totalAmount || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Phí vận chuyển</span>
                                <span style={{ color: '#22c55e' }}>Miễn phí</span>
                            </div>
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '18px', 
                            fontWeight: 700,
                            marginBottom: '20px'
                        }}>
                            <span>Tổng cộng</span>
                            <span style={{ color: '#e63946' }}>{formatPrice(cart.totalAmount || 0)}</span>
                        </div>

                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            size="large"
                            loading={loading}
                            onClick={() => form.submit()}
                            style={{
                                height: '48px',
                                fontSize: '16px',
                                fontWeight: 600,
                                background: '#e63946',
                                borderColor: '#e63946'
                            }}
                        >
                            {paymentMethod === 'COD' ? 'Đặt hàng (COD)' : 'Thanh toán ngay'}
                        </Button>

                        <div style={{ 
                            marginTop: '16px', 
                            padding: '12px', 
                            background: '#f8f9fa', 
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#666'
                        }}>
                            <CheckCircleOutlined style={{ color: '#22c55e', marginRight: '8px' }} />
                            Bạn sẽ thanh toán khi nhận được hàng
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default CheckoutPage;
