import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, Input, notification, Space, Tag, Popconfirm, DatePicker, Row, Col, Card, Statistic, Empty, Drawer, Descriptions, Divider, Typography, Badge, List, message } from 'antd';
import { EyeOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, StopOutlined, TruckOutlined, ExclamationCircleOutlined, DollarOutlined, ShoppingCartOutlined, CloseCircleOutlined, BellOutlined, ShopOutlined } from '@ant-design/icons';
import { getAllOrdersAdminApi, getOrderStatisticsApi, updateOrderStatusApi, deleteOrderApi, handleCancellationRequestApi } from '../../util/api';

const { RangePicker } = DatePicker;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const ORDER_STATUS_CONFIG = {
    pending: { color: 'gold', label: 'Chờ xác nhận', icon: <ClockCircleOutlined /> },
    confirmed: { color: 'processing', label: 'Đã xác nhận', icon: <CheckCircleOutlined /> },
    shop_preparing: { color: 'blue', label: 'Shop chuẩn bị hàng', icon: <ShopOutlined /> },
    shipping: { color: 'cyan', label: 'Đang giao hàng', icon: <TruckOutlined /> },
    delivered: { color: 'success', label: 'Đã giao hàng', icon: <CheckCircleOutlined /> },
    cancelled: { color: 'error', label: 'Đã hủy', icon: <StopOutlined /> }
};

const PAYMENT_STATUS_CONFIG = {
    pending: { color: 'gold', label: 'Chờ thanh toán' },
    paid: { color: 'success', label: 'Đã thanh toán' },
    failed: { color: 'error', label: 'Thanh toán thất bại' }
};

const PAYMENT_METHOD_LABELS = {
    COD: 'Thanh toán khi nhận hàng (COD)',
    VNPAY: 'VNPAY',
    MOMO: 'Momo',
    ZALOPAY: 'ZaloPay'
};

const AdminOrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [filters, setFilters] = useState({ status: null, search: '', dateRange: null, showCancellationRequests: false });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [isCancellationModalVisible, setIsCancellationModalVisible] = useState(false);
    const [cancellationAction, setCancellationAction] = useState(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [statusForm] = Form.useForm();
    const [updating, setUpdating] = useState(false);

    const fetchOrders = async (params = {}) => {
        setLoading(true);
        try {
            const page = Math.max(1, params.page || pagination.page);
            const limit = Math.max(1, Math.min(100, params.limit || pagination.limit));
            const queryParams = {
                page,
                limit,
                ...filters,
                startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
                endDate: filters.dateRange?.[1]?.endOf('day').format('YYYY-MM-DD')
            };
            delete queryParams.dateRange;

            const res = await getAllOrdersAdminApi(queryParams);
            if (res) {
                setOrders(res.orders || []);
                if (res.pagination) {
                    setPagination(prev => ({ ...prev, ...res.pagination }));
                }
            }
        } catch (error) {
            console.error("Fetch orders error:", error);
            notification.error({ message: "Lỗi", description: "Không thể tải danh sách đơn hàng" });
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        setStatsLoading(true);
        try {
            const res = await getOrderStatisticsApi();
            if (res) {
                setStatistics(res);
            }
        } catch (error) {
            console.error("Fetch statistics error:", error);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchStatistics();
    }, []);

    const handleTableChange = (pag) => {
        fetchOrders({ page: pag.current, limit: pag.pageSize });
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchOrders({ page: 1 });
    };

    const handleResetFilters = () => {
        setFilters({ status: null, search: '', dateRange: null, showCancellationRequests: false });
        setPagination(prev => ({ ...prev, page: 1 }));
        setTimeout(() => fetchOrders({ page: 1 }), 0);
    };

    const showOrderDetail = (record) => {
        setSelectedOrder(record);
        setIsDetailVisible(true);
    };

    const handleUpdateStatus = (record) => {
        setSelectedOrder(record);
        statusForm.setFieldsValue({
            orderStatus: record.orderStatus,
            paymentStatus: record.paymentStatus
        });
        setIsStatusModalVisible(true);
    };

    const onStatusUpdate = async (values) => {
        if (!selectedOrder) return;
        setUpdating(true);
        try {
            await updateOrderStatusApi(selectedOrder._id, values);
            notification.success({ message: "Thành công", description: "Cập nhật trạng thái đơn hàng thành công" });
            setIsStatusModalVisible(false);
            statusForm.resetFields();
            fetchOrders();
            fetchStatistics();
        } catch (error) {
            notification.error({ message: "Lỗi", description: error.response?.data?.message || "Có lỗi xảy ra" });
        } finally {
            setUpdating(false);
        }
    };

    const handleCancellationClick = (record, action) => {
        setSelectedOrder(record);
        setCancellationAction(action);
        setCancellationReason('');
        setIsCancellationModalVisible(true);
    };

    const onHandleCancellation = async () => {
        if (!selectedOrder || !cancellationAction) return;
        setUpdating(true);
        try {
            await handleCancellationRequestApi(selectedOrder._id, cancellationAction, cancellationReason);
            notification.success({ 
                message: "Thành công", 
                description: cancellationAction === 'approve' ? "Đã duyệt hủy đơn hàng" : "Đã từ chối yêu cầu hủy" 
            });
            setIsCancellationModalVisible(false);
            fetchOrders();
            fetchStatistics();
            setIsDetailVisible(false);
        } catch (error) {
            notification.error({ message: "Lỗi", description: error.response?.data?.message || "Có lỗi xảy ra" });
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            await deleteOrderApi(orderId);
            notification.success({ message: "Thành công", description: "Đã xóa đơn hàng" });
            fetchOrders();
            fetchStatistics();
        } catch (error) {
            notification.error({ message: "Lỗi", description: error.response?.data?.message || "Không thể xóa đơn hàng" });
        }
    };

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: '_id',
            key: '_id',
            width: 140,
            render: (id) => <Text copyable={{ text: id }} style={{ fontFamily: 'monospace', fontSize: 12 }}>{id.slice(-8).toUpperCase()}</Text>
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            width: 180,
            render: (_, record) => (
                <div>
                    <Text strong>{record.shippingAddress?.fullName || 'N/A'}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.shippingAddress?.phone || 'N/A'}</Text>
                    {record.cancellationRequest?.status === 'pending' && (
                        <div>
                            <Badge status="warning" text={<Text type="warning" style={{ fontSize: 11 }}>Yêu cầu hủy</Text>} />
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Sản phẩm',
            key: 'items',
            width: 200,
            render: (_, record) => (
                <div>
                    {record.items?.slice(0, 2).map((item, idx) => (
                        <div key={idx} style={{ fontSize: 12 }}>
                            <Text ellipsis style={{ maxWidth: 180 }}>{item.name}</Text>
                            <Text type="secondary"> x{item.quantity}</Text>
                        </div>
                    ))}
                    {record.items?.length > 2 && (
                        <Text type="secondary">+{record.items.length - 2} sản phẩm khác</Text>
                    )}
                </div>
            )
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 130,
            align: 'right',
            render: (amount) => <Text strong style={{ color: '#e74c3c' }}>{amount?.toLocaleString()} ₫</Text>
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            width: 140,
            render: (_, record) => (
                <div>
                    <Tag color={PAYMENT_STATUS_CONFIG[record.paymentStatus]?.color}>
                        {PAYMENT_STATUS_CONFIG[record.paymentStatus]?.label}
                    </Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>{PAYMENT_METHOD_LABELS[record.paymentMethod] || record.paymentMethod}</Text>
                </div>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'orderStatus',
            key: 'orderStatus',
            width: 160,
            render: (status) => {
                const config = ORDER_STATUS_CONFIG[status] || { color: 'default', label: status };
                return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
            }
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 110,
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 180,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small" direction="vertical">
                    <Space size="small">
                        <Button 
                            type="primary" 
                            ghost 
                            icon={<EyeOutlined />} 
                            size="small"
                            onClick={() => showOrderDetail(record)}
                        >
                            Chi tiết
                        </Button>
                        <Button 
                            icon={<FileTextOutlined />} 
                            size="small"
                            onClick={() => handleUpdateStatus(record)}
                            disabled={record.orderStatus === 'delivered' || record.orderStatus === 'cancelled'}
                        >
                            Cập nhật
                        </Button>
                    </Space>
                    {record.cancellationRequest?.status === 'pending' && (
                        <Space size="small">
                            <Button 
                                size="small"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleCancellationClick(record, 'approve')}
                                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                            >
                                Duyệt hủy
                            </Button>
                            <Button 
                                size="small"
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => handleCancellationClick(record, 'reject')}
                            >
                                Từ chối
                            </Button>
                        </Space>
                    )}
                    {['cancelled', 'delivered'].includes(record.orderStatus) && (
                        <Popconfirm
                            title="Bạn có chắc muốn xóa đơn hàng này?"
                            onConfirm={() => handleDeleteOrder(record._id)}
                            okText="Có"
                            cancelText="Không"
                            okButtonProps={{ danger: true }}
                        >
                            <Button danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    const renderStatisticsCards = () => (
        <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
                <Card size="small" loading={statsLoading}>
                    <Statistic 
                        title="Tổng đơn hàng" 
                        value={statistics?.summary?.totalOrders || 0}
                        prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card size="small" loading={statsLoading}>
                    <Statistic 
                        title="Tổng doanh thu" 
                        value={statistics?.summary?.totalRevenue || 0}
                        prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                        suffix="đ"
                        formatter={(value) => value.toLocaleString()}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card size="small" loading={statsLoading}>
                    <Statistic 
                        title="Đơn chờ xử lý" 
                        value={statistics?.summary?.pendingOrders || 0}
                        prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card size="small" loading={statsLoading}>
                    <Statistic 
                        title="Yêu cầu hủy" 
                        value={statistics?.summary?.pendingCancellationRequests || 0}
                        prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                    />
                </Card>
            </Col>
        </Row>
    );

    const renderOrderDetail = () => {
        if (!selectedOrder) return null;
        
        const statusConfig = ORDER_STATUS_CONFIG[selectedOrder.orderStatus] || { color: 'default', label: selectedOrder.orderStatus };

        return (
            <div>
                <div style={{ 
                    padding: 16, 
                    background: '#f6ffed', 
                    borderRadius: 8, 
                    marginBottom: 24,
                    border: '1px solid #b7eb8f'
                }}>
                    <Tag color={statusConfig.color} icon={statusConfig.icon} style={{ fontSize: 14, padding: '6px 16px' }}>
                        {statusConfig.label}
                    </Tag>
                </div>

                <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="Mã đơn hàng">
                        <Text copyable style={{ fontFamily: 'monospace' }}>{selectedOrder._id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày đặt">
                        {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cập nhật lần cuối">
                        {new Date(selectedOrder.updatedAt).toLocaleString('vi-VN')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái đơn hàng">
                        <Tag color={statusConfig.color} icon={statusConfig.icon}>
                            {statusConfig.label}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Thanh toán">
                        <Tag color={PAYMENT_STATUS_CONFIG[selectedOrder.paymentStatus]?.color}>
                            {PAYMENT_STATUS_CONFIG[selectedOrder.paymentStatus]?.label}
                        </Tag>
                        <Text type="secondary"> - {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod]}</Text>
                    </Descriptions.Item>
                </Descriptions>

                {/* Cancellation Request Info */}
                {selectedOrder.cancellationRequest?.status === 'pending' && (
                    <Card size="small" style={{ marginBottom: 16, background: '#fffbe6', border: '1px solid #ffe58f' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <BellOutlined style={{ color: '#faad14' }} />
                            <Text strong type="warning">Yêu cầu hủy đơn từ khách hàng</Text>
                        </div>
                        {selectedOrder.cancellationRequest.reason && (
                            <Paragraph style={{ marginBottom: 8 }}>
                                <strong>Lý do:</strong> {selectedOrder.cancellationRequest.reason}
                            </Paragraph>
                        )}
                        <Text type="secondary">
                            Yêu cầu lúc: {new Date(selectedOrder.cancellationRequest.requestedAt).toLocaleString('vi-VN')}
                        </Text>
                        <div style={{ marginTop: 12 }}>
                            <Space>
                                <Button 
                                    type="primary" 
                                    icon={<CheckCircleOutlined />}
                                    onClick={() => {
                                        setIsDetailVisible(false);
                                        handleCancellationClick(selectedOrder, 'approve');
                                    }}
                                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                >
                                    Duyệt hủy
                                </Button>
                                <Button 
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => {
                                        setIsDetailVisible(false);
                                        handleCancellationClick(selectedOrder, 'reject');
                                    }}
                                >
                                    Từ chối
                                </Button>
                            </Space>
                        </div>
                    </Card>
                )}

                <Divider orientation="left">Thông tin khách hàng</Divider>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Tên khách hàng">{selectedOrder.shippingAddress?.fullName}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{selectedOrder.shippingAddress?.phone}</Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ giao hàng">
                        {[selectedOrder.shippingAddress?.address, 
                          selectedOrder.shippingAddress?.ward,
                          selectedOrder.shippingAddress?.district,
                          selectedOrder.shippingAddress?.city].filter(Boolean).join(', ')}
                    </Descriptions.Item>
                    {selectedOrder.shippingAddress?.note && (
                        <Descriptions.Item label="Ghi chú">{selectedOrder.shippingAddress.note}</Descriptions.Item>
                    )}
                </Descriptions>

                <Divider orientation="left">Sản phẩm ({selectedOrder.items?.length})</Divider>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '12px 0',
                            borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                        }}>
                            <img 
                                src={item.image || 'https://placehold.co/60x60'} 
                                alt={item.name}
                                style={{ width: 60, height: 60, objectFit: 'cover', marginRight: 12, borderRadius: 4 }}
                            />
                            <div style={{ flex: 1 }}>
                                <Text strong>{item.name}</Text>
                                <br />
                                <Text type="secondary">Đơn giá: {(item.promotionalPrice || item.price)?.toLocaleString()} ₫ x {item.quantity}</Text>
                            </div>
                            <Text strong style={{ color: '#e74c3c' }}>
                                {((item.promotionalPrice || item.price) * item.quantity).toLocaleString()} ₫
                            </Text>
                        </div>
                    ))}
                </div>

                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 16 }}>Tổng cộng:</Text>
                    <Text strong style={{ fontSize: 20, color: '#e74c3c' }}>
                        {selectedOrder.totalAmount?.toLocaleString()} ₫
                    </Text>
                </div>

                {/* Status History */}
                {selectedOrder.statusHistory?.length > 0 && (
                    <>
                        <Divider orientation="left">Lịch sử trạng thái</Divider>
                        <List
                            size="small"
                            dataSource={[...selectedOrder.statusHistory].reverse()}
                            renderItem={(item) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                        title={ORDER_STATUS_CONFIG[item.status]?.label || item.status}
                                        description={
                                            <>
                                                {item.note && <div>{item.note}</div>}
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {new Date(item.timestamp).toLocaleString('vi-VN')}
                                                </Text>
                                            </>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </>
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
            <Title level={3} style={{ marginBottom: 24 }}>
                <FileTextOutlined style={{ marginRight: 8 }} />
                Quản lý Đơn hàng
            </Title>

            {renderStatisticsCards()}

            <Card style={{ marginBottom: 16 }}>
                <Row gutter={16} align="middle">
                    <Col flex="auto">
                        <Space wrap>
                            <Input.Search
                                placeholder="Tìm theo tên, SĐT, mã đơn..."
                                allowClear
                                style={{ width: 250 }}
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                onSearch={handleSearch}
                                prefix={<SearchOutlined />}
                            />
                            <Select
                                placeholder="Lọc theo trạng thái"
                                allowClear
                                style={{ width: 180 }}
                                value={filters.status}
                                onChange={(value) => {
                                    setFilters(prev => ({ ...prev, status: value }));
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                            >
                                <Select.Option value="pending">Chờ xác nhận</Select.Option>
                                <Select.Option value="confirmed">Đã xác nhận</Select.Option>
                                <Select.Option value="shop_preparing">Shop chuẩn bị hàng</Select.Option>
                                <Select.Option value="shipping">Đang giao hàng</Select.Option>
                                <Select.Option value="delivered">Đã giao hàng</Select.Option>
                                <Select.Option value="cancelled">Đã hủy</Select.Option>
                            </Select>
                            <RangePicker 
                                value={filters.dateRange}
                                onChange={(dates) => {
                                    setFilters(prev => ({ ...prev, dateRange: dates }));
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                format="DD/MM/YYYY"
                                placeholder={['Từ ngày', 'Đến ngày']}
                            />
                        </Space>
                    </Col>
                    <Col>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                                Đặt lại
                            </Button>
                            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                                Tìm kiếm
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey="_id"
                    loading={loading}
                    onChange={handleTableChange}
                    scroll={{ x: 1400 }}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: pagination.total,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
                        pageSizeOptions: ['10', '20', '50']
                    }}
                    locale={{ emptyText: <Empty description="Không có đơn hàng nào" /> }}
                />
            </Card>

            {/* Order Detail Drawer */}
            <Drawer
                title="Chi tiết đơn hàng"
                placement="right"
                width={600}
                onClose={() => setIsDetailVisible(false)}
                open={isDetailVisible}
                extra={
                    <Button 
                        type="primary" 
                        icon={<FileTextOutlined />}
                        onClick={() => {
                            setIsDetailVisible(false);
                            if (selectedOrder) handleUpdateStatus(selectedOrder);
                        }}
                        disabled={selectedOrder?.orderStatus === 'delivered' || selectedOrder?.orderStatus === 'cancelled'}
                    >
                        Cập nhật trạng thái
                    </Button>
                }
            >
                {renderOrderDetail()}
            </Drawer>

            {/* Update Status Modal */}
            <Modal
                title="Cập nhật trạng thái đơn hàng"
                open={isStatusModalVisible}
                onCancel={() => {
                    setIsStatusModalVisible(false);
                    statusForm.resetFields();
                }}
                footer={null}
            >
                <Form
                    form={statusForm}
                    layout="vertical"
                    onFinish={onStatusUpdate}
                >
                    <Form.Item
                        name="orderStatus"
                        label="Trạng thái đơn hàng"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                    >
                        <Select>
                            <Select.Option value="pending">
                                <Tag color="gold" icon={<ClockCircleOutlined />}>Chờ xác nhận</Tag>
                            </Select.Option>
                            <Select.Option value="confirmed">
                                <Tag color="processing" icon={<CheckCircleOutlined />}>Đã xác nhận</Tag>
                            </Select.Option>
                            <Select.Option value="shop_preparing">
                                <Tag color="blue" icon={<ShopOutlined />}>Shop chuẩn bị hàng</Tag>
                            </Select.Option>
                            <Select.Option value="shipping">
                                <Tag color="cyan" icon={<TruckOutlined />}>Đang giao hàng</Tag>
                            </Select.Option>
                            <Select.Option value="delivered">
                                <Tag color="success" icon={<CheckCircleOutlined />}>Đã giao hàng</Tag>
                            </Select.Option>
                            <Select.Option value="cancelled">
                                <Tag color="error" icon={<CloseCircleOutlined />}>Đã hủy</Tag>
                            </Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="paymentStatus"
                        label="Trạng thái thanh toán"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái thanh toán' }]}
                    >
                        <Select>
                            <Select.Option value="pending">
                                <Tag color="gold">Chờ thanh toán</Tag>
                            </Select.Option>
                            <Select.Option value="paid">
                                <Tag color="success">Đã thanh toán</Tag>
                            </Select.Option>
                            <Select.Option value="failed">
                                <Tag color="error">Thanh toán thất bại</Tag>
                            </Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
                        <Space>
                            <Button onClick={() => {
                                setIsStatusModalVisible(false);
                                statusForm.resetFields();
                            }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit" loading={updating}>
                                Cập nhật
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Handle Cancellation Modal */}
            <Modal
                title={cancellationAction === 'approve' ? "Duyệt hủy đơn hàng" : "Từ chối yêu cầu hủy"}
                open={isCancellationModalVisible}
                onCancel={() => setIsCancellationModalVisible(false)}
                onOk={onHandleCancellation}
                okText={cancellationAction === 'approve' ? "Duyệt hủy" : "Từ chối"}
                okButtonProps={{ 
                    danger: cancellationAction === 'reject',
                    loading: updating,
                    style: cancellationAction === 'approve' ? { background: '#52c41a', borderColor: '#52c41a' } : {}
                }}
                cancelText="Hủy"
            >
                {cancellationAction === 'approve' ? (
                    <div>
                        <Paragraph>
                            Bạn đang duyệt yêu cầu hủy đơn hàng. Hệ thống sẽ hoàn lại số lượng sản phẩm vào kho.
                        </Paragraph>
                        {selectedOrder?.cancellationRequest?.reason && (
                            <div style={{ 
                                padding: 12, 
                                background: '#f6ffed', 
                                borderRadius: 8, 
                                border: '1px solid #b7eb8f',
                                marginTop: 16
                            }}>
                                <Text type="secondary">Lý do khách hàng:</Text>
                                <div>{selectedOrder.cancellationRequest.reason}</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <Paragraph>
                            Bạn đang từ chối yêu cầu hủy đơn hàng. Đơn hàng sẽ tiếp tục được xử lý.
                        </Paragraph>
                    </div>
                )}
                <div style={{ marginTop: 16 }}>
                    <Text strong>Ghi chú (không bắt buộc):</Text>
                    <TextArea 
                        rows={3} 
                        placeholder="Nhập ghi chú..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        style={{ marginTop: 8 }}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default AdminOrderManagement;
