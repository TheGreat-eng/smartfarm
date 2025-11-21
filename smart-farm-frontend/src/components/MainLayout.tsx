// smart-farm-frontend/src/components/MainLayout.tsx

import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    Layout,
    Menu,
    Button,
    Avatar,
    Dropdown,
    type MenuProps,
    Space,
} from 'antd';
import {
    DashboardOutlined,
    HomeOutlined,
    LogoutOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Sun, Wind } from 'lucide-react';
import { useFarmContext } from '../context/FarmContext'; // Import context

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
    children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // Để highlight menu đang active
    const { selectedFarm } = useFarmContext(); // Lấy thông tin nông trại đang chọn

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        navigate('/');
    };

    const menuItems: MenuProps['items'] = [
        {
            key: '1',
            label: 'Thông tin tài khoản',
            icon: <UserOutlined />,
            disabled: true, // Sẽ làm chức năng này sau
        },
        {
            key: '2',
            label: 'Đăng xuất',
            icon: <LogoutOutlined />,
            onClick: handleLogout,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>

                <div style={{
                    height: '32px',
                    margin: '16px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    textAlign: 'center',
                    lineHeight: '32px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    borderRadius: '6px'
                }}>
                    {collapsed ? 'SF' : 'SmartFarm'}
                </div>

                {selectedFarm && (
                    <div style={{ padding: '0 16px 16px', color: 'white', textAlign: 'center', borderBottom: '1px solid #ffffff30', marginBottom: 10 }}>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>Đang quản lý:</div>
                        <div style={{ fontWeight: 'bold', color: '#52c41a', fontSize: 16 }}>{selectedFarm.name}</div>
                    </div>
                )}

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]} // Tự động highlight theo URL
                >
                    <Menu.Item key="/farms" icon={<HomeOutlined />} onClick={() => navigate('/farms')}>
                        Đổi Nông Trại
                    </Menu.Item>

                    {/* Chỉ cho bấm vào Dashboard nếu đã chọn nông trại */}
                    <Menu.Item
                        key="/dashboard"
                        icon={<DashboardOutlined />}
                        onClick={() => navigate('/dashboard')}
                        disabled={!selectedFarm} // Nếu chưa chọn thì disable
                    >
                        Dashboard Tổng
                    </Menu.Item>

                    {/* --- ĐÃ SỬA: THÊM SỰ KIỆN ONCLICK --- */}
                    <Menu.Item
                        key="/weather"
                        icon={<Sun />}
                        onClick={() => navigate('/weather')} // <-- Thêm dòng này để chuyển trang
                        disabled={!selectedFarm}
                    >
                        Thời tiết
                    </Menu.Item>
                    {/* ------------------------------------ */}

                    <Menu.Item key="4" icon={<Wind />} disabled>
                        AI Dự đoán
                    </Menu.Item>
                </Menu>
            </Sider>
            <Layout>
                <Header style={{
                    padding: '0 24px',
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
                        <Button type="text" style={{ height: 'auto', padding: 0 }}>
                            <Space>
                                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                                <span style={{ marginRight: 8 }}>Xin chào, User!</span>
                            </Space>
                        </Button>
                    </Dropdown>
                </Header>
                <Content style={{ margin: '24px 16px', overflow: 'initial' }}>
                    <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
                        {/* Các trang con sẽ được render ở đây */}
                        {children ? children : <Outlet />}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;