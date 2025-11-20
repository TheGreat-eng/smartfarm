import React, { useEffect, useState } from 'react';
import {
    Layout, Typography, Table, Button, message, Card, Row, Col,
    Modal, Tag, Tabs, Statistic
} from 'antd';
import {
    DeleteOutlined, UserOutlined, LogoutOutlined, HomeOutlined,
    AppstoreOutlined, ExperimentOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const { Header, Content } = Layout;
const { Title } = Typography;

// Kiểu dữ liệu User
interface User {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
}

// Kiểu dữ liệu Thống kê
interface SystemStats {
    totalUsers: number;
    totalFarms: number;
    totalDevices: number;
}






// Thêm interface mới
interface ActivityLog {
    id: number;
    username: string;
    action: string;
    entity: string;
    details: string;
    ipAddress: string;
    timestamp: string;
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();

    // States
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<SystemStats>({ totalUsers: 0, totalFarms: 0, totalDevices: 0 });
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<ActivityLog[]>([]); // State mới cho Logs



    // Hàm lấy dữ liệu
    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, statsRes, logsRes] = await Promise.all([
                apiClient.get<User[]>('/admin/users'),
                apiClient.get('/admin/stats'),
                apiClient.get<ActivityLog[]>('/admin/logs') // Gọi thêm API log
            ]);
            setUsers(usersRes.data);
            setStats(statsRes.data);
            setLogs(logsRes.data);
        } catch (error) {
            message.error('Không thể tải dữ liệu Admin.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteUser = (userId: number) => {
        Modal.confirm({
            title: 'Xóa người dùng?',
            content: 'Hành động này sẽ xóa user và tất cả dữ liệu của họ vĩnh viễn.',
            okText: 'Xóa',
            okType: 'danger',
            onOk: async () => {
                try {
                    await apiClient.delete(`/admin/users/${userId}`);
                    message.success('Đã xóa người dùng');
                    fetchData(); // Load lại dữ liệu
                } catch (error) {
                    message.error('Xóa thất bại');
                }
            }
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    // Cột bảng User
    const userColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Username', dataIndex: 'username', key: 'username' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag color={role === 'ROLE_ADMIN' ? 'red' : 'green'}>
                    {role === 'ROLE_ADMIN' ? 'QUẢN TRỊ VIÊN' : 'NGƯỜI DÙNG'}
                </Tag>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: User) => (
                <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteUser(record.id)}
                    disabled={record.role === 'ROLE_ADMIN'}
                >
                    Xóa
                </Button>
            ),
        },
    ];


    // Cấu hình cột cho bảng Log
    const logColumns = [
        {
            title: 'Thời gian',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 180,
            render: (text: string) => new Date(text).toLocaleString('vi-VN')
        },
        {
            title: 'Người dùng',
            dataIndex: 'username',
            key: 'username',
            width: 120,
            render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Hành động',
            dataIndex: 'action',
            key: 'action',
            width: 120,
            render: (text: string) => {
                let color = 'default';
                if (text.includes('TẠO') || text.includes('THÊM')) color = 'success';
                if (text.includes('XÓA')) color = 'error';
                if (text.includes('CẬP NHẬT')) color = 'warning';
                if (text.includes('ĐIỀU KHIỂN')) color = 'purple';
                return <Tag color={color}>{text}</Tag>;
            }
        },
        { title: 'Đối tượng', dataIndex: 'entity', key: 'entity', width: 120 },
        { title: 'Chi tiết', dataIndex: 'details', key: 'details', ellipsis: true },
    ];

    // Giao diện Tab Thống Kê (Dashboard)
    const renderDashboardTab = () => (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
                <Card bordered={false} style={{ background: '#e6f7ff' }}>
                    <Statistic
                        title="Tổng Người Dùng"
                        value={stats.totalUsers}
                        prefix={<UserOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={8}>
                <Card bordered={false} style={{ background: '#f6ffed' }}>
                    <Statistic
                        title="Tổng Nông Trại"
                        value={stats.totalFarms}
                        prefix={<AppstoreOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={8}>
                <Card bordered={false} style={{ background: '#fff7e6' }}>
                    <Statistic
                        title="Tổng Thiết Bị IoT"
                        value={stats.totalDevices}
                        prefix={<ExperimentOutlined />}
                        valueStyle={{ color: '#faad14' }}
                    />
                </Card>
            </Col>
        </Row>
    );

    // Cấu hình các Tab
    const items = [
        {
            key: '1',
            label: 'Tổng quan hệ thống',
            children: renderDashboardTab(),
            icon: <AppstoreOutlined />,
        },
        {
            key: '2',
            label: 'Quản lý người dùng',
            children: <Table dataSource={users} columns={userColumns} rowKey="id" loading={loading} />,
            icon: <UserOutlined />,
        },
        {
            key: '3',
            label: 'Nhật ký hoạt động',
            children: (
                <Table
                    dataSource={logs}
                    columns={logColumns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            ),
            icon: <SafetyCertificateOutlined />,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#001529', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#fff', marginRight: '10px' }} />
                    <Title level={3} style={{ color: '#fff', margin: 0, marginRight: 20 }}>Admin Portal</Title>
                    <Button icon={<HomeOutlined />} onClick={() => navigate('/farms')} ghost>Xem trang User</Button>
                </div>
                <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>Đăng xuất</Button>
            </Header>

            <Content style={{ padding: '24px' }}>
                <Card>
                    <Tabs defaultActiveKey="1" items={items} />
                </Card>
            </Content>
        </Layout>
    );
};

export default AdminDashboard;