import React, { useEffect } from 'react';
import { Button, Result, Card, Descriptions, Divider, Row, Col } from 'antd';
import { CheckCircleOutlined, EnvironmentOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const OrderSuccessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const order = location.state?.order;

    useEffect(() => {
        if (!order) {
            navigate('/');
        }
    }, [order, navigate]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    if (!order) {
        return null;
    }

    const getStatusText = (status) => {
        const statusMap = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            shipping: 'Đang giao hàng',
            delivered: 'Đã giao hàng',
            cancelled: 'Đã hủy'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            pending: '#faad14',
            confirmed: '#1890ff',
            shipping: '#722ed1',
            delivered: '#52c41a',
            cancelled: '#ff4d4f'
        };
        return colorMap[status] || '#999';
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
            <Result
                status="success"
                title="Đặt hàng thành công!"
                subTitle={`Mã đơn hàng: ${order._id?.slice(-8).toUpperCase() || 'N/A'}`}
                extra={[
                    <Button 
                        type="primary" 
                        key="orders"
                        onClick={() => navigate('/orders')}
                    >
                        Xem đơn hàng
                    </Button>,
                    <Button 
                        key="continue"
                        onClick={() => navigate('/')}
                    >
                        Tiếp tục mua sắm
                    </Button>
                ]}
            />

            <Card style={{ marginTop: '24px' }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={14}>
                        <h3 style={{ marginBottom: '16px' }}>
                            <UserOutlined /> Thông tin giao hàng
                        </h3>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Người nhận">
                                {order.shippingAddress?.fullName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                {order.shippingAddress?.phone}
                            </Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ">
                                {order.shippingAddress?.address}, {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.city}
                            </Descriptions.Item>
                            {order.shippingAddress?.note && (
                                <Descriptions.Item label="Ghi chú">
                                    {order.shippingAddress.note}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Col>

                    <Col xs={24} lg={10}>
                        <h3 style={{ marginBottom: '16px' }}>
                            <EnvironmentOutlined /> Trạng thái đơn hàng
                        </h3>
                        <div style={{
                            padding: '16px',
                            background: '#fef2f2',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: getStatusColor(order.orderStatus)
                            }}>
                                {getStatusText(order.orderStatus)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                {order.paymentMethod === 'COD' && 'Thanh toán khi nhận hàng (COD)'}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>

            <Card title="Chi tiết đơn hàng" style={{ marginTop: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                    {order.items?.map((item, index) => (
                        <div 
                            key={index}
                            style={{ 
                                display: 'flex', 
                                gap: '16px', 
                                padding: '16px 0',
                                borderBottom: index < order.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                            }}
                        >
                            <img 
                                src={item.image || 'https://via.placeholder.com/80'} 
                                alt={item.name}
                                style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    objectFit: 'cover',
                                    borderRadius: '8px'
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.name}</div>
                                <div style={{ color: '#666', fontSize: '13px' }}>
                                    Đơn giá: {formatPrice(item.promotionalPrice !== null ? item.promotionalPrice : item.price)}
                                </div>
                                <div style={{ color: '#666', fontSize: '13px' }}>
                                    Số lượng: {item.quantity}
                                </div>
                            </div>
                            <div style={{ 
                                fontWeight: 600, 
                                color: '#e63946',
                                fontSize: '16px'
                            }}>
                                {formatPrice((item.promotionalPrice !== null ? item.promotionalPrice : item.price) * item.quantity)}
                            </div>
                        </div>
                    ))}
                </div>

                <Divider style={{ margin: '16px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Tạm tính</span>
                            <span>{formatPrice(order.totalAmount)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Phí vận chuyển</span>
                            <span style={{ color: '#22c55e' }}>Miễn phí</span>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            fontSize: '18px',
                            fontWeight: 700
                        }}>
                            <span>Tổng cộng</span>
                            <span style={{ color: '#e63946' }}>{formatPrice(order.totalAmount)}</span>
                        </div>
                    </div>
                </div>
            </Card>

            <Card 
                style={{ marginTop: '24px', background: '#f6ffed', borderColor: '#b7eb8f' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                            Cảm ơn bạn đã đặt hàng!
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                            Đơn hàng của bạn đang chờ được xác nhận. Chúng tôi sẽ gửi thông báo khi đơn hàng được xử lý.
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default OrderSuccessPage;
