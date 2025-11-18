// smart-farm-frontend/src/components/MainLayout.tsx

import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
    children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
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
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                    <Menu.Item key="1" icon={<HomeOutlined />} onClick={() => navigate('/farms')}>
                        Nông trại của tôi
                    </Menu.Item>
                    <Menu.Item key="2" icon={<DashboardOutlined />} disabled>
                        Dashboard Tổng
                    </Menu.Item>
                    <Menu.Item key="3" icon={<Sun />} disabled>
                        Thời tiết
                    </Menu.Item>
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