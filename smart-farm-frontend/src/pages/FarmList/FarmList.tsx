import React, { useState, useEffect } from 'react';
import { Layout, Typography, List, Card, Button, message, Modal, Form, Input, App } from 'antd';
import {
    LogoutOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    SafetyCertificateOutlined // Thêm icon cho nút Admin cho đẹp
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const { Header, Content } = Layout;
const { Title } = Typography;

interface Farm {
    id: number;
    name: string;
    location: string;
}

const FarmListPage: React.FC = () => {
    const navigate = useNavigate();
    const { modal } = App.useApp();

    // --- THÊM: Lấy role của user hiện tại ---
    const userRole = localStorage.getItem('userRole');

    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingFarm, setEditingFarm] = useState<Farm | null>(null);

    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const fetchFarms = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<Farm[]>('/farms');
            setFarms(response.data);
        } catch (error) {
            message.error('Không thể tải danh sách nông trại!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFarms();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole'); // Xóa cả role khi logout
        delete apiClient.defaults.headers.common['Authorization'];
        message.success('Đã đăng xuất!');
        navigate('/');
    };

    const handleFarmClick = (farmId: number) => {
        navigate(`/farms/${farmId}`);
    };

    // --- Xử lý Thêm ---
    const showAddFarmModal = () => setIsAddModalVisible(true);
    const handleAddCancel = () => {
        setIsAddModalVisible(false);
        addForm.resetFields();
    };
    const handleAddFarm = async (values: { name: string; location: string }) => {
        try {
            const response = await apiClient.post('/farms', values);
            message.success(`Đã thêm nông trại "${response.data.name}"!`);
            fetchFarms();
            handleAddCancel();
        } catch (error) {
            message.error('Thêm nông trại thất bại!');
        }
    };

    // --- Xử lý Sửa ---
    const showEditFarmModal = (farm: Farm) => {
        setEditingFarm(farm);
        editForm.setFieldsValue(farm);
        setIsEditModalVisible(true);
    };
    const handleEditCancel = () => {
        setIsEditModalVisible(false);
        setEditingFarm(null);
        editForm.resetFields();
    };
    const handleUpdateFarm = async (values: { name: string; location: string }) => {
        if (!editingFarm) return;
        try {
            await apiClient.put(`/farms/${editingFarm.id}`, values);
            message.success(`Cập nhật nông trại thành công!`);
            fetchFarms();
            handleEditCancel();
        } catch (error) {
            message.error('Cập nhật thất bại!');
        }
    };

    // --- Xử lý Xóa ---
    const showDeleteConfirm = (farmId: number, farmName: string) => {
        modal.confirm({
            title: `Bạn có chắc muốn xóa nông trại "${farmName}"?`,
            icon: <ExclamationCircleOutlined />,
            content: 'Hành động này không thể hoàn tác. Tất cả thiết bị và quy tắc liên quan cũng sẽ bị xóa.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await apiClient.delete(`/farms/${farmId}`);
                    message.success(`Đã xóa nông trại "${farmName}".`);
                    fetchFarms();
                } catch (error) {
                    message.error('Xóa nông trại thất bại!');
                }
            },
        });
    };

    if (loading) {
        return <div style={{ padding: 50, textAlign: 'center' }}>Đang tải dữ liệu...</div>;
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* --- PHẦN HEADER ĐÃ ĐƯỢC CẬP NHẬT --- */}
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Title level={3} style={{ color: '#1890ff', margin: '0 20px 0 0' }}>Quản Lý Nông Trại</Title>

                    {/* Kiểm tra quyền Admin để hiển thị nút */}
                    {userRole === 'ROLE_ADMIN' && (
                        <Button
                            type="dashed"
                            icon={<SafetyCertificateOutlined />}
                            onClick={() => navigate('/admin')}
                            style={{ borderColor: '#faad14', color: '#faad14' }} // Màu vàng cam cho nổi bật
                        >
                            Trang Admin
                        </Button>
                    )}
                </div>

                <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
                    Đăng xuất
                </Button>
            </Header>

            <Content style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Title level={4}>Danh sách nông trại của bạn</Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={showAddFarmModal}>
                        Thêm Nông Trại Mới
                    </Button>
                </div>
                <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                    dataSource={farms}
                    renderItem={(farm) => (
                        <List.Item>
                            <Card
                                title={farm.name}
                                hoverable
                                onClick={() => handleFarmClick(farm.id)}
                            >
                                <p><strong>Vị trí:</strong> {farm.location}</p>
                                <div
                                    style={{
                                        marginTop: '16px',
                                        paddingTop: '16px',
                                        borderTop: '1px solid #f0f0f0',
                                        display: 'flex',
                                        justifyContent: 'space-around'
                                    }}
                                >
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            showEditFarmModal(farm);
                                        }}
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            showDeleteConfirm(farm.id, farm.name);
                                        }}
                                    />
                                </div>
                            </Card>
                        </List.Item>
                    )}
                />
            </Content>

            {/* Modal Thêm */}
            <Modal
                title="Thêm Nông Trại Mới"
                open={isAddModalVisible}
                onOk={addForm.submit}
                onCancel={handleAddCancel}
                okText="Thêm"
                cancelText="Hủy"
            >
                <Form form={addForm} layout="vertical" onFinish={handleAddFarm}>
                    <Form.Item
                        name="name"
                        label="Tên Nông Trại"
                        rules={[{ required: true, message: 'Vui lòng nhập tên nông trại!' }]}
                    >
                        <Input placeholder="Ví dụ: Vườn Rau Sạch Đà Lạt" />
                    </Form.Item>
                    <Form.Item
                        name="location"
                        label="Vị Trí"
                        rules={[{ required: true, message: 'Vui lòng nhập vị trí!' }]}
                    >
                        <Input placeholder="Ví dụ: Lâm Đồng" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Sửa */}
            <Modal
                title="Chỉnh Sửa Nông Trại"
                open={isEditModalVisible}
                onOk={editForm.submit}
                onCancel={handleEditCancel}
                okText="Lưu thay đổi"
                cancelText="Hủy"
            >
                <Form form={editForm} layout="vertical" onFinish={handleUpdateFarm}>
                    <Form.Item name="name" label="Tên Nông Trại" rules={[{ required: true, message: 'Vui lòng nhập tên nông trại!' }]}>
                        <Input placeholder="Ví dụ: Vườn Rau Sạch Đà Lạt" />
                    </Form.Item>
                    <Form.Item name="location" label="Vị Trí" rules={[{ required: true, message: 'Vui lòng nhập vị trí!' }]}>
                        <Input placeholder="Ví dụ: Lâm Đồng" />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default FarmListPage;