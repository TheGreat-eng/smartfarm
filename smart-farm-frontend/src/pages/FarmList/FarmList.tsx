import React, { useState, useEffect } from 'react';
import { Layout, Typography, List, Card, Button, message, Modal, Form, Input, App } from 'antd';
import { LogoutOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
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
    const { modal } = App.useApp(); // Sử dụng hook từ App context
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
        delete apiClient.defaults.headers.common['Authorization'];
        message.success('Đã đăng xuất!');
        navigate('/login');
    };

    const handleFarmClick = (farmId: number) => {
        navigate(`/farms/${farmId}`);
    };

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

    const showDeleteConfirm = (farmId: number, farmName: string) => {
        console.log('showDeleteConfirm called with:', farmId, farmName);

        modal.confirm({
            title: `Bạn có chắc muốn xóa nông trại "${farmName}"?`,
            icon: <ExclamationCircleOutlined />,
            content: 'Hành động này không thể hoàn tác. Tất cả thiết bị và quy tắc liên quan cũng sẽ bị xóa.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                console.log('Delete confirmed, calling API...');
                try {
                    await apiClient.delete(`/farms/${farmId}`);
                    message.success(`Đã xóa nông trại "${farmName}".`);
                    fetchFarms();
                } catch (error) {
                    console.error('Delete error:', error);
                    message.error('Xóa nông trại thất bại!');
                }
            },
        });
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
                <Title level={3} style={{ color: '#1890ff', margin: 0 }}>Quản Lý Nông Trại</Title>
                <Button type="primary" icon={<LogoutOutlined />} onClick={handleLogout}>
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

            <Modal
                title="Thêm Nông Trại Mới"
                open={isAddModalVisible}
                onOk={addForm.submit}
                onCancel={handleAddCancel}
                okText="Thêm"
                cancelText="Hủy"
            >
                <Form
                    form={addForm}
                    layout="vertical"
                    onFinish={handleAddFarm}
                >
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