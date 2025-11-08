import React, { useState, useEffect } from 'react';
import { Layout, Typography, List, Card, Button, message, Modal, Form, Input } from 'antd'; // Thêm Modal, Form, Input
import { LogoutOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'; // Thêm EditOutlined, DeleteOutlined
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
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);

    // State cho Modal thêm nông trại
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm(); // Hook để quản lý Form

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
        // Tạm thời comment lại, sẽ làm ở bước 3
        // navigate(`/farms/${farmId}`);
        navigate(`/farms/${farmId}`);
    };

    // ---- CHỨC NĂNG THÊM MỚI ----
    const showAddFarmModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields(); // Reset form khi đóng modal
    };

    const handleAddFarm = async (values: { name: string; location: string }) => {
        try {
            const response = await apiClient.post('/farms', values);
            message.success(`Đã thêm nông trại "${response.data.name}"!`);
            fetchFarms(); // Tải lại danh sách nông trại
            handleCancel(); // Đóng và reset modal
        } catch (error) {
            message.error('Thêm nông trại thất bại!');
        }
    };


    // ... (Phần render khi loading không đổi) ...
    if (loading) { /* ... */ }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Header không đổi */}
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
                <Title level={3} style={{ color: '#1890ff', margin: 0 }}>Quản Lý Nông Trại</Title>
                <Button type="primary" icon={<LogoutOutlined />} onClick={handleLogout}>
                    Đăng xuất
                </Button>
            </Header>
            <Content style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Title level={4}>Danh sách nông trại của bạn</Title>
                    {/* Nút này sẽ mở Modal */}
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
                                // Thêm nút Sửa và Xóa
                                actions={[
                                    <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); message.info('Chức năng sửa sắp ra mắt!'); }} />,
                                    <DeleteOutlined key="delete" onClick={(e) => { e.stopPropagation(); message.error('Chức năng xóa sắp ra mắt!'); }} />,
                                ]}
                            >
                                <p><strong>Vị trí:</strong> {farm.location}</p>
                            </Card>
                        </List.Item>
                    )}
                />
            </Content>

            {/* ---- MODAL THÊM NÔNG TRẠI ---- */}
            <Modal
                title="Thêm Nông Trại Mới"
                open={isModalVisible}
                onOk={() => form.submit()} // Khi nhấn OK, submit form
                onCancel={handleCancel}
                okText="Thêm"
                cancelText="Hủy"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleAddFarm} // Hàm xử lý khi form được submit thành công
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
        </Layout>
    );
};

export default FarmListPage;