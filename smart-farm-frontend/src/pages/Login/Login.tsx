import React from 'react';
import { Form, Input, Button, Card, Flex, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api'; // Sẽ tạo ở bước 3

const { Title } = Typography;

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        try {
            // Gửi request đăng nhập tới backend
            const response = await apiClient.post('/auth/login', {
                email: values.username,
                password: values.password,
            });

            // Giả sử API trả về một object có chứa accessToken
            const { accessToken } = response.data;

            // Lưu token vào localStorage để xác thực cho các request sau
            localStorage.setItem('authToken', accessToken);

            // Cấu hình header cho các request tiếp theo
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            message.success('Đăng nhập thành công!');

            // Chuyển hướng đến trang danh sách nông trại
            navigate('/farms');

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
                    </Form.Item>
                </Form>
            </Card>
        </Flex>
    );
};

export default LoginPage;