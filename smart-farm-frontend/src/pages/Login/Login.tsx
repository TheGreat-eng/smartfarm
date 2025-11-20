import React from 'react';
import { Form, Input, Button, Card, Flex, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title } = Typography;

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        try {
            // SỬA LỖI TẠI ĐÂY: Truyền đúng object chứa username và password
            const response = await apiClient.post('/auth/login', {
                username: values.username,
                password: values.password,
            });

            // Backend trả về: { accessToken: "...", role: "ROLE_USER" }
            // Destructuring để lấy token và role
            const { accessToken, role } = response.data;

            // Lưu token và role vào localStorage
            localStorage.setItem('authToken', accessToken);
            localStorage.setItem('userRole', role);

            // Cấu hình header cho các request tiếp theo
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            message.success('Đăng nhập thành công!');

            // Điều hướng dựa trên Role
            if (role === 'ROLE_ADMIN') {
                navigate('/admin');
            } else {
                navigate('/farms');
            }

        } catch (error) {
            console.error('Đăng nhập thất bại:', error);
            message.error('Tên đăng nhập hoặc mật khẩu không đúng!');
        }
    };

    return (
        <Flex justify="center" align="center" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400 }}>
                <Flex vertical align="center">
                    <Title level={2}>Nông Nghiệp Thông Minh</Title>
                    <Title level={4}>Đăng nhập hệ thống</Title>
                </Flex>
                <Form
                    name="normal_login"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Đăng nhập
                        </Button>
                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                            Chưa có tài khoản? <Link to="/register">Đăng ký ngay!</Link>
                        </div>
                    </Form.Item>
                </Form>
            </Card>
        </Flex>
    );
};

export default LoginPage;