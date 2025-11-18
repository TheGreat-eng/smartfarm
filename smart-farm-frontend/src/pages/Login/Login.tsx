// smart-farm-frontend/src/pages/Login/Login.tsx

import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        try {
            const response = await apiClient.post('/auth/login', {
                username: values.username,
                password: values.password,
            });
            const { accessToken } = response.data;
            localStorage.setItem('authToken', accessToken);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            message.success('Đăng nhập thành công!');
            navigate('/farms');
        } catch (error) {
            message.error('Tên đăng nhập hoặc mật khẩu không đúng!');
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Cột trái - Hình ảnh */}
            <div
                style={{
                    width: '60%',
                    background: 'url(https://images.unsplash.com/photo-1586798271654-01314b8a1a3a?q=80&w=2574&auto=format&fit=crop) no-repeat center center',
                    backgroundSize: 'cover',
                }}
            ></div>

            {/* Cột phải - Form đăng nhập */}
            <div style={{ width: '40%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
                <Card style={{ width: 400, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <Title level={2}>Smart Farm</Title>
                        <Text type="secondary">Chào mừng trở lại!</Text>
                    </div>
                    <Form name="normal_login" onFinish={onFinish}>
                        <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}>
                            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" size="large" />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block size="large">
                                Đăng nhập
                            </Button>
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <Text>Chưa có tài khoản? <Link to="/register">Đăng ký ngay!</Link></Text>
                            </div>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;