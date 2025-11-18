// smart-farm-frontend/src/pages/FarmList/FarmList.tsx

import React, { useState, useEffect } from 'react';
import {
    Typography, List, Card, Button, message, Modal, Form,
    Input, App, Spin, Row, Col, Statistic, Badge
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { Droplet, Thermometer } from 'lucide-react';

const { Title } = Typography;

interface Farm {
    id: number;
    name: string;
    location: string;
}

const FarmListPage: React.FC = () => {
    const navigate = useNavigate();
    const { modal } = App.useApp();
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

    useEffect(() => { fetchFarms(); }, []);

    const handleFarmClick = (farmId: number) => navigate(`/farms/${farmId}`);
    const showAddFarmModal = () => setIsAddModalVisible(true);
    const handleAddCancel = () => {
        setIsAddModalVisible(false);
        addForm.resetFields();
    };
    const handleAddFarm = async (values: { name: string; location: string }) => {
        try {
            await apiClient.post('/farms', values);
            message.success(`Đã thêm nông trại mới!`);
            fetchFarms();
            handleAddCancel();
        } catch (error) { message.error('Thêm nông trại thất bại!'); }
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
            message.success(`Cập nhật thành công!`);
            fetchFarms();
            handleEditCancel();
        } catch (error) { message.error('Cập nhật thất bại!'); }
    };

    const showDeleteConfirm = (farm: Farm) => {
        modal.confirm({
            title: `Bạn có chắc muốn xóa nông trại "${farm.name}"?`,
            icon: <ExclamationCircleOutlined />,
            content: 'Tất cả thiết bị và quy tắc liên quan cũng sẽ bị xóa.',
            okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await apiClient.delete(`/farms/${farm.id}`);
                    message.success(`Đã xóa nông trại.`);
                    fetchFarms();
                } catch (error) { message.error('Xóa thất bại!'); }
            },
        });
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={3}>Danh sách nông trại</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={showAddFarmModal}>
                    Thêm Nông Trại
                </Button>
            </div>
            <List
                grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 4 }}
                dataSource={farms}
                renderItem={(farm) => (
                    <List.Item>
                        <Badge.Ribbon text="Ổn định" color="green">
                            <Card
                                hoverable
                                onClick={() => handleFarmClick(farm.id)}
                                actions={[
                                    <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); showEditFarmModal(farm); }} />,
                                    <DeleteOutlined key="delete" onClick={(e) => { e.stopPropagation(); showDeleteConfirm(farm); }} />,
                                ]}
                            >
                                <Card.Meta
                                    title={<Typography.Title level={5}>{farm.name}</Typography.Title>}
                                    description={farm.location}
                                />
                                <Row gutter={16} style={{ marginTop: 20 }}>
                                    <Col span={12}>
                                        <Statistic title="Nhiệt độ" value="28.2°C" prefix={<Thermometer size={14} />} />
                                    </Col>
                                    <Col span={12}>
                                        <Statistic title="Độ ẩm đất" value="65%" prefix={<Droplet size={14} />} />
                                    </Col>
                                </Row>
                            </Card>
                        </Badge.Ribbon>
                    </List.Item>
                )}
            />

            <Modal title="Thêm Nông Trại Mới" open={isAddModalVisible} onOk={addForm.submit} onCancel={handleAddCancel} okText="Thêm" cancelText="Hủy">
                <Form form={addForm} layout="vertical" onFinish={handleAddFarm}>
                    <Form.Item name="name" label="Tên Nông Trại" rules={[{ required: true }]}>
                        <Input placeholder="Ví dụ: Vườn Rau Đà Lạt" />
                    </Form.Item>
                    <Form.Item name="location" label="Vị Trí" rules={[{ required: true }]}>
                        <Input placeholder="Ví dụ: Lâm Đồng" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title="Chỉnh Sửa Nông Trại" open={isEditModalVisible} onOk={editForm.submit} onCancel={handleEditCancel} okText="Lưu" cancelText="Hủy">
                <Form form={editForm} layout="vertical" onFinish={handleUpdateFarm}>
                    <Form.Item name="name" label="Tên Nông Trại" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="location" label="Vị Trí" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default FarmListPage;