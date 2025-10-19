import React from 'react';
import { Layout, Typography, List, Card, Button, message } from 'antd';
import { LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title } = Typography;

// Định nghĩa kiểu dữ liệu cho một nông trại
interface Farm {
    id: number;
    name: string;
    location: string;
    area: number; // m2
}

// Dữ liệu giả để hiển thị giao diện
const mockFarms: Farm[] = [
    { id: 1, name: 'Vườn Rau Sạch Đà Lạt', location: 'Lâm Đồng', area: 500 },
    { id: 2, name: 'Trang Trại Dưa Lưới Hưng Yên', location: 'Hưng Yên', area: 1200 },
    { id: 3, name: 'Vườn Cà Chua Công Nghệ Cao', location: 'Củ Chi, TP.HCM', area: 800 },
];

const FarmListPage: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Xóa token khỏi localStorage
        localStorage.removeItem('authToken');
        message.success('Đã đăng xuất!');
        // Chuyển về trang đăng nhập
        navigate('/login');
    };

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
                    <Button type="primary" icon={<PlusOutlined />}>
                        Thêm Nông Trại Mới
                    </Button>
                </div>
                <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                    dataSource={mockFarms}
                    renderItem={(farm) => (
                        <List.Item>
                            <Card title={farm.name} hoverable onClick={() => message.info(`Xem chi tiết nông trại ${farm.name}`)}>
                                <p><strong>Vị trí:</strong> {farm.location}</p>
                                <p><strong>Diện tích:</strong> {farm.area} m²</p>
                            </Card>
                        </List.Item>
                    )}
                />
            </Content>
        </Layout>
    );
};

export default FarmListPage;