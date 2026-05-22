import React, { useState, useEffect, useContext } from 'react';
import { Card, Tag, Button, Modal, Descriptions, Empty, Spin, Popconfirm, message, Input, Timeline, Tabs, Badge, Typography, Divider, List, Row, Col, Space } from 'antd';
import { 
    EyeOutlined, CloseCircleOutlined, HistoryOutlined, 
    CheckCircleOutlined, ClockCircleOutlined, ShopOutlined, 
    CarOutlined, InboxOutlined, ExclamationCircleOutlined,
    BellOutlined, SendOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/context/auth.context';
import { getOrdersApi, cancelOrderApi } from '../util/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ORDER_STATUS_CONFIG = {
    pending: { 
        color: 'gold', 
        text: 'Đơn hàng mới', 
        icon: <ClockCircleOutlined />,
        description: 'Đơn hàng của bạn đã được tiếp nhận và đang chờ xác nhận'
    },
    confirmed: { 
        color: 'processing', 
        text: 'Đã xác nhận', 
        icon: <CheckCircleOutlined />,
        description: 'Đơn hàng đã được xác nhận. Shop sẽ chuẩn bị hàng sớm nhất.'
    },
    shop_preparing: { 
        color: 'blue', 
        text: 'Shop đang chuẩn bị hàng', 
        icon: <ShopOutlined />,
        description: 'Shop đang đóng gói và chuẩn bị hàng cho bạn'
    },
    shipping: { 
        color: 'cyan', 
        text: 'Đang giao hàng', 
        icon: <CarOutlined />,
        description: 'Đơn hàng đang được vận chuyển đến bạn'
    },
    delivered: { 
        color: 'success', 
        text: 'Đã giao thành công', 
        icon: <InboxOutlined />,
        description: 'Đơn hàng đã được giao thành công'
    },
    cancelled: { 
        color: 'error', 
        text: 'Đã hủy', 
        icon: <CloseCircleOutlined />,
        description: 'Đơn hàng đã bị hủy'
    }
};

const PAYMENT_METHOD_LABELS = {
    COD: 'Thanh toán khi nhận hàng (COD)',
    VNPAY: 'VNPAY',
    MOMO: 'Momo',
    ZALOPAY: 'ZaloPay'
};

const OrderHistoryPage = () => {
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (!auth.isAuthenticated) {
            message.warning('Vui lòng đăng nhập để xem đơn hàng');
            navigate('/login');
            return;
        }
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [auth.isAuthenticated, navigate]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await getOrdersApi();
            if (res && Array.isArray(res)) {
                setOrders(res);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            message.error('Có lỗi khi tải đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const canCancelOrder = (order) => {
        if (!order || !order.orderStatus) return false;
        if (['cancelled', 'delivered', 'shipping'].includes(order.orderStatus)) {
            return false;
        }
        
        const createdTime = new Date(order.createdAt).getTime();
        const now = Date.now();
        const timeDiffMinutes = (now - createdTime) / (1000 * 60);
        
        // Trong 30 phút và status là pending/confirmed
        if (['pending', 'confirmed'].includes(order.orderStatus) && timeDiffMinutes <= 30) {
            return true;
        }
        
        // Shop đang chuẩn bị -> chỉ gửi yêu cầu hủy
        if (order.orderStatus === 'shop_preparing') {
            return 'request_only';
        }
        
        return false;
    };

    const handleViewDetail = (order) => {
        const latestOrder = orders.find(o => o._id === order._id) || order;
        setSelectedOrder(latestOrder);
        setIsDetailModalVisible(true);
    };

    const handleCancelClick = (order) => {
        setSelectedOrder(order);
        setCancelReason('');
        setIsCancelModalVisible(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedOrder) return;
        
        setCancelling(true);
        try {
            const res = await cancelOrderApi(selectedOrder._id, cancelReason);
            if (res) {
                if (res.isRequest) {
                    message.success('Yêu cầu hủy đơn đã được gửi. Shop sẽ xem xét trong thời gian sớm nhất.');
                } else {
                    message.success('Hủy đơn hàng thành công');
                }
                setIsCancelModalVisible(false);
                fetchOrders();
                setIsDetailModalVisible(false);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Có lỗi khi hủy đơn hàng';
            message.error(errorMsg);
        } finally {
            setCancelling(false);
        }
    };

    const getTimelineSteps = (order) => {
        const statusOrder = ['pending', 'confirmed', 'shop_preparing', 'shipping', 'delivered'];
        const currentIndex = statusOrder.indexOf(order.orderStatus);
        
        return statusOrder.map((status, index) => ({
            status,
            ...ORDER_STATUS_CONFIG[status],
            completed: index <= currentIndex,
            current: index === currentIndex,
            timestamp: order.statusHistory?.find(h => h.status === status)?.timestamp
        }));
    };

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'all') return true;
        if (activeTab === 'active') return !['cancelled', 'delivered'].includes(order.orderStatus);
        if (activeTab === 'cancelled') return order.orderStatus === 'cancelled';
        return true;
    });

    const renderOrderCard = (order) => {
        const statusConfig = ORDER_STATUS_CONFIG[order.orderStatus] || { color: 'default', text: order.orderStatus, icon: null };
        const cancelStatus = canCancelOrder(order);

        return (
            <Card 
                key={order._id} 
                style={{ marginBottom: 16, borderRadius: 12 }}
                className="order-card"
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Mã đơn hàng</Text>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            #{order._id?.slice(-8).toUpperCase()}
                        </div>
                    </div>
                    <Tag color={statusConfig.color} icon={statusConfig.icon} style={{ fontSize: 13, padding: '4px 12px' }}>
                        {statusConfig.text}
                    </Tag>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Ngày đặt</Text>
                    <div>{formatDate(order.createdAt)}</div>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Sản phẩm ({order.items?.length || 0})</Text>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        {order.items?.slice(0, 3).map((item, idx) => (
                            <img 
                                key={idx}
                                src={item.image || 'https://placehold.co/50x50'} 
                                alt={item.name}
                                style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }}
                            />
                        ))}
                        {order.items?.length > 3 && (
                            <div style={{ 
                                width: 50, height: 50, 
                                background: '#f5f5f5', 
                                borderRadius: 8, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: 12,
                                color: '#666'
                            }}>
                                +{order.items.length - 3}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Tổng tiền</Text>
                        <div style={{ fontWeight: 700, color: '#e63946', fontSize: 16 }}>
                            {formatPrice(order.totalAmount)}
                        </div>
                    </div>
                    <Space>
                        <Button type="primary" ghost icon={<EyeOutlined />} onClick={() => handleViewDetail(order)}>
                            Chi tiết
                        </Button>
                        {cancelStatus && (
                            <Button 
                                danger 
                                icon={cancelStatus === 'request_only' ? <SendOutlined /> : <CloseCircleOutlined />}
                                onClick={() => handleCancelClick(order)}
                            >
                                {cancelStatus === 'request_only' ? 'Yêu cầu hủy' : 'Hủy đơn'}
                            </Button>
                        )}
                    </Space>
                </div>

                {/* Cancellation Request Status */}
                {order.cancellationRequest?.status === 'pending' && (
                    <div style={{ 
                        marginTop: 16, 
                        padding: 12, 
                        background: '#fffbe6', 
                        borderRadius: 8,
                        border: '1px solid #ffe58f'
                    }}>
                        <Badge status="warning" text={
                            <Text type="warning">
                                <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                                Yêu cầu hủy đơn đang chờ shop xử lý
                            </Text>
                        } />
                    </div>
                )}
            </Card>
        );
    };

    const renderOrderDetail = () => {
        if (!selectedOrder) return null;
        
        const timelineSteps = getTimelineSteps(selectedOrder);
        const statusConfig = ORDER_STATUS_CONFIG[selectedOrder.orderStatus] || { color: 'default', text: selectedOrder.orderStatus };
        const cancelStatus = canCancelOrder(selectedOrder);

        return (
            <div>
                <div style={{ 
                    padding: 16, 
                    background: '#f6ffed', 
                    borderRadius: 8, 
                    marginBottom: 24,
                    border: '1px solid #b7eb8f'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Tag color={statusConfig.color} icon={statusConfig.icon} style={{ fontSize: 14, padding: '6px 16px' }}>
                            {statusConfig.text}
                        </Tag>
                        <Text style={{ color: '#52c41a' }}>
                            {statusConfig.description}
                        </Text>
                    </div>
                </div>

                {/* Timeline Progress */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5}>Tiến trình đơn hàng</Title>
                    <Timeline
                        items={timelineSteps.map((step, index) => ({
                            color: step.completed ? 'green' : 'gray',
                            dot: step.current ? step.icon : (step.completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />),
                            children: (
                                <div style={{ paddingLeft: step.current ? 0 : 8 }}>
                                    <Text strong={step.current} style={{ color: step.completed ? '#52c41a' : '#999' }}>
                                        {step.text}
                                    </Text>
                                    {step.timestamp && (
                                        <div style={{ fontSize: 12, color: '#999' }}>
                                            {formatDate(step.timestamp)}
                                        </div>
                                    )}
                                </div>
                            )
                        }))}
                    />
                </div>

                <Divider />

                {/* Shipping Info */}
                <Descriptions title="Thông tin giao hàng" column={2} size="small" bordered>
                    <Descriptions.Item label="Người nhận">
                        {selectedOrder.shippingAddress?.fullName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                        {selectedOrder.shippingAddress?.phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>
                        {[selectedOrder.shippingAddress?.address, 
                          selectedOrder.shippingAddress?.ward,
                          selectedOrder.shippingAddress?.district,
                          selectedOrder.shippingAddress?.city].filter(Boolean).join(', ')}
                    </Descriptions.Item>
                    {selectedOrder.shippingAddress?.note && (
                        <Descriptions.Item label="Ghi chú" span={2}>
                            {selectedOrder.shippingAddress.note}
                        </Descriptions.Item>
                    )}
                </Descriptions>

                {/* Payment Info */}
                <Descriptions title="Thông tin thanh toán" column={2} size="small" style={{ marginTop: 16 }}>
                    <Descriptions.Item label="Phương thức">
                        {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái thanh toán">
                        <Tag color={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'}>
                            {selectedOrder.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Tag>
                    </Descriptions.Item>
                </Descriptions>

                {/* Products */}
                <div style={{ marginTop: 24 }}>
                    <Title level={5}>Sản phẩm đã đặt ({selectedOrder.items?.length})</Title>
                    {selectedOrder.items?.map((item, index) => (
                        <div 
                            key={index}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '12px 0',
                                borderBottom: index < selectedOrder.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                            }}
                        >
                            <img 
                                src={item.image || 'https://placehold.co/60x60'} 
                                alt={item.name}
                                style={{ 
                                    width: 60, 
                                    height: 60, 
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    marginRight: 12
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <Text strong>{item.name}</Text>
                                <br />
                                <Text type="secondary">
                                    {formatPrice(item.promotionalPrice !== null ? item.promotionalPrice : item.price)} x {item.quantity}
                                </Text>
                            </div>
                            <Text strong style={{ color: '#e63946' }}>
                                {formatPrice((item.promotionalPrice !== null ? item.promotionalPrice : item.price) * item.quantity)}
                            </Text>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '2px solid #f0f0f0'
                }}>
                    <div style={{ textAlign: 'right' }}>
                        <Text>Tổng cộng: </Text>
                        <Text strong style={{ color: '#e63946', fontSize: 20, marginLeft: 8 }}>
                            {formatPrice(selectedOrder.totalAmount)}
                        </Text>
                    </div>
                </div>

                {/* Order History */}
                {selectedOrder.statusHistory?.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                        <Title level={5}>Lịch sử đơn hàng</Title>
                        <List
                            size="small"
                            dataSource={[...selectedOrder.statusHistory].reverse()}
                            renderItem={(item) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Badge status="success" />}
                                        title={ORDER_STATUS_CONFIG[item.status]?.text || item.status}
                                        description={
                                            <>
                                                {item.note && <div>{item.note}</div>}
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {formatDate(item.timestamp)}
                                                </Text>
                                            </>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </div>
                )}

                {/* Cancellation Request Info */}
                {selectedOrder.cancellationRequest?.status === 'pending' && (
                    <div style={{ 
                        marginTop: 24, 
                        padding: 16, 
                        background: '#fffbe6', 
                        borderRadius: 8,
                        border: '1px solid #ffe58f'
                    }}>
                        <Text type="warning" strong>
                            <BellOutlined style={{ marginRight: 8 }} />
                            Yêu cầu hủy đơn đang chờ xử lý
                        </Text>
                        {selectedOrder.cancellationRequest.reason && (
                            <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                                Lý do: {selectedOrder.cancellationRequest.reason}
                            </Paragraph>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!auth.isAuthenticated) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    const activeCount = orders.filter(o => !['cancelled', 'delivered'].includes(o.orderStatus)).length;
    const cancelledCount = orders.filter(o => o.orderStatus === 'cancelled').length;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <HistoryOutlined style={{ fontSize: '28px' }} />
                <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
                    Theo dõi đơn hàng
                </h1>
            </div>

            {/* Tabs */}
            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                style={{ marginBottom: 24 }}
                items={[
                    { key: 'all', label: `Tất cả (${orders.length})` },
                    { key: 'active', label: `Đang xử lý (${activeCount})` },
                    { key: 'cancelled', label: `Đã hủy (${cancelledCount})` }
                ]}
            />

            <Card>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <Spin size="large" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <Empty 
                        description="Không có đơn hàng nào"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" onClick={() => navigate('/')}>
                            Tiếp tục mua sắm
                        </Button>
                    </Empty>
                ) : (
                    <div>
                        {filteredOrders.map(renderOrderCard)}
                    </div>
                )}
            </Card>

            {/* Order Detail Modal */}
            <Modal
                title={`Chi tiết đơn hàng #${selectedOrder?._id?.slice(-8).toUpperCase()}`}
                open={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                footer={[
                    canCancelOrder(selectedOrder) && (
                        <Button 
                            key="cancel" 
                            danger 
                            icon={canCancelOrder(selectedOrder) === 'request_only' ? <SendOutlined /> : <CloseCircleOutlined />}
                            onClick={() => {
                                setIsDetailModalVisible(false);
                                handleCancelClick(selectedOrder);
                            }}
                        >
                            {canCancelOrder(selectedOrder) === 'request_only' ? 'Yêu cầu hủy đơn' : 'Hủy đơn hàng'}
                        </Button>
                    ),
                    <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                {renderOrderDetail()}
            </Modal>

            {/* Cancel Order Modal */}
            <Modal
                title={canCancelOrder(selectedOrder) === 'request_only' ? "Yêu cầu hủy đơn hàng" : "Hủy đơn hàng"}
                open={isCancelModalVisible}
                onCancel={() => setIsCancelModalVisible(false)}
                onOk={handleConfirmCancel}
                okText={canCancelOrder(selectedOrder) === 'request_only' ? "Gửi yêu cầu" : "Xác nhận hủy"}
                okButtonProps={{ danger: true, loading: cancelling }}
                cancelText="Không hủy"
            >
                {canCancelOrder(selectedOrder) === 'request_only' ? (
                    <div>
                        <Paragraph>
                            Đơn hàng đang được shop chuẩn bị. Bạn có thể gửi yêu cầu hủy đơn, shop sẽ xem xét và phản hồi sớm nhất.
                        </Paragraph>
                    </div>
                ) : (
                    <div>
                        <Paragraph>
                            Bạn có chắc muốn hủy đơn hàng này không? Sau khi hủy, số lượng sản phẩm sẽ được hoàn lại vào kho.
                        </Paragraph>
                    </div>
                )}
                <div style={{ marginTop: 16 }}>
                    <Text strong>Lý do hủy (không bắt buộc):</Text>
                    <TextArea 
                        rows={3} 
                        placeholder="VD: Đặt nhầm sản phẩm, thay đổi địa chỉ giao hàng..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        style={{ marginTop: 8 }}
                    />
                </div>
            </Modal>

            <style>{`
                .order-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default OrderHistoryPage;
