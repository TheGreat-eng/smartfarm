import React from 'react';
import { Form, Input, Button, Card, Flex, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title } = Typography;

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();

    // Xử lý khi người dùng submit form đăng ký
    const onFinish = async (values: any) => {
        if (values.password !== values.confirmPassword) {
            message.error('Mật khẩu xác nhận không khớp!');
            return;
        }
        try {
            await apiClient.post('/auth/register', {
                username: values.username,
                email: values.email,
                password: values.password,
                fullName: values.fullName
            });
            message.success('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (error: any) {
            message.error(error.response?.data || 'Đăng ký thất bại!');
        }
    };

    return (
        <Flex justify="center" align="center" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400 }}>
                <Flex vertical align="center">
                    <Title level={2}>Nông Nghiệp Thông Minh</Title>
                    <Title level={4}>Đăng ký tài khoản</Title>
                </Flex>
                <Form name="register" onFinish={onFinish}>
                    <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
                    </Form.Item>
                    <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>
                    <Form.Item name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Họ và Tên" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                    </Form.Item>
                    <Form.Item name="confirmPassword" rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận lại mật khẩu" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Đăng ký
                        </Button>
                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                            Đã có tài khoản? <Link to="/login">Đăng nhập ngay!</Link>
                        </div>
                    </Form.Item>
                </Form>
            </Card>
        </Flex>
    );
};

export default RegisterPage;