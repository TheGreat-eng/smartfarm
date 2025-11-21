// smart-farm-frontend/src/pages/FarmList/FarmList.tsx
import React, { useState, useEffect } from 'react';
import { Layout, Typography, List, Card, Button, message, Modal, Form, Input, App, Tag } from 'antd';
import {
    LogoutOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
    ExclamationCircleOutlined, SafetyCertificateOutlined, ArrowRightOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const { Header, Content } = Layout;
const { Title } = Typography;
const { Meta } = Card;
import { useFarmContext } from '../../context/FarmContext'; // Import Hook

interface Farm {
    id: number;
    name: string;
    location: string;
}

const FarmListPage: React.FC = () => {
    const navigate = useNavigate();
    const { selectFarm } = useFarmContext(); // Lấy hàm selectFarm từ Context
    const { modal } = App.useApp();
    const userRole = localStorage.getItem('userRole');

    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
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


    // --- CHUYỂN HƯỚNG SANG DASHBOARD ---
    const goToDashboard = (farmId: number) => {
        navigate(`/farms/${farmId}/dashboard`);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        delete apiClient.defaults.headers.common['Authorization'];
        navigate('/');
    };

    // const handleFarmClick = (farmId: number) => {
    //     navigate(`/farms/${farmId}`);
    // };

    // --- Xử lý Thêm ---
    const showAddFarmModal = () => setIsAddModalVisible(true);
    const handleAddCancel = () => { setIsAddModalVisible(false); addForm.resetFields(); };
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


    // --- SỬA HÀM NÀY ---
    const handleSelectFarm = (farm: Farm) => {
        // 1. Lưu nông trại vào Context (và LocalStorage)
        selectFarm(farm);

        // 2. Thông báo nhỏ
        message.success(`Đã chọn nông trại: ${farm.name}`);

        // 3. Chuyển hướng sang trang Dashboard Tổng (route chung)
        navigate('/dashboard');
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
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Title level={3} style={{ color: '#1890ff', margin: '0 20px 0 0' }}>Quản Lý Nông Trại</Title>
                    {userRole === 'ROLE_ADMIN' && (
                        <Button type="dashed" icon={<SafetyCertificateOutlined />} onClick={() => navigate('/admin')} style={{ borderColor: '#faad14', color: '#faad14' }}>
                            Trang Admin
                        </Button>
                    )}
                </div>
                <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>Đăng xuất</Button>
            </Header>

            <Content style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Title level={4}>Danh sách nông trại của bạn</Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={showAddFarmModal} size="large">
                        Thêm Nông Trại Mới
                    </Button>
                </div>

                <List
                    grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                    dataSource={farms}
                    renderItem={(farm) => (
                        <List.Item>
                            <Card
                                hoverable
                                style={{ borderRadius: '10px', overflow: 'hidden' }}
                                actions={[
                                    <Button type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); showEditFarmModal(farm); }}>Sửa</Button>,
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); showDeleteConfirm(farm.id, farm.name); }}>Xóa</Button>
                                ]}
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{farm.name}</span>
                                        <Tag color="blue">#{farm.id}</Tag>
                                    </div>
                                }
                            >
                                <div style={{ minHeight: '80px' }}>
                                    <p><strong>Vị trí:</strong> {farm.location}</p>
                                    <div style={{ marginTop: '16px' }}>
                                        {/* Nút này giờ gọi handleSelectFarm */}
                                        <Button
                                            type="primary"
                                            block
                                            onClick={() => handleSelectFarm(farm)}
                                        >
                                            Vào Dashboard
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </List.Item>
                    )}
                />
            </Content>

            {/* Modal Thêm/Sửa giữ nguyên như cũ */}
            <Modal title="Thêm Nông Trại Mới" open={isAddModalVisible} onOk={addForm.submit} onCancel={handleAddCancel} okText="Thêm">
                <Form form={addForm} layout="vertical" onFinish={handleAddFarm}>
                    <Form.Item name="name" label="Tên Nông Trại" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="location" label="Vị Trí" rules={[{ required: true }]}><Input /></Form.Item>
                </Form>
            </Modal>

            <Modal title="Chỉnh Sửa Nông Trại" open={isEditModalVisible} onOk={editForm.submit} onCancel={handleEditCancel} okText="Lưu">
                <Form form={editForm} layout="vertical" onFinish={handleUpdateFarm}>
                    <Form.Item name="name" label="Tên Nông Trại" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="location" label="Vị Trí" rules={[{ required: true }]}><Input /></Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default FarmListPage;