import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Layout, Typography, Button, message, Row, Col, Card, Spin, Divider,
    Modal, Form, Input, Select, List, Tag, notification, App
} from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { Thermometer, Droplet, Sun, Zap } from 'lucide-react';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import apiClient from '../../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// Định nghĩa các kiểu dữ liệu (TypeScript Interfaces)
interface SensorData {
    temperature?: number;
    humidity?: number;
    soil_moisture?: number;
    light?: number;
}

interface SensorDataResponse {
    metricType: string;
    value: number;
    time: string;
}

interface Device {
    id: number;
    name: string;
    type: string;
    deviceIdentifier: string;
}

interface Rule {
    id: number;
    name: string;
    conditionMetric: string;
    conditionOperator: string;
    conditionValue: number;
    actionType: string;
    sensorDeviceId: number;
    actuatorDeviceId: number;
}

function parseJwt(token: string) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        console.error("Failed to parse JWT", e);
        return null;
    }
}

const FarmDetailPage: React.FC = () => {
    const { farmId } = useParams<{ farmId: string }>();
    const navigate = useNavigate();
    const { modal } = App.useApp(); // Thêm dòng này

    // States cho dữ liệu
    const [sensorData, setSensorData] = useState<SensorData>({});
    const [devices, setDevices] = useState<Device[]>([]);
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState({
        sensors: true,
        devices: true,
        rules: true
    });

    // States cho Modal
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

    const [deviceForm] = Form.useForm();
    const [ruleForm] = Form.useForm();

    // --- HÀM LẤY DỮ LIỆU TỪ BACKEND ---
    const fetchData = useCallback(async () => {
        // Lấy dữ liệu cảm biến
        try {
            const sensorResponse = await apiClient.get<SensorDataResponse[]>(`/farms/${farmId}/sensordata/latest`);
            const formattedData: SensorData = sensorResponse.data.reduce((acc, item) => {
                const key = item.metricType.toLowerCase();
                if (key === 'temperature' || key === 'humidity' || key === 'soil_moisture' || key === 'light') {
                    acc[key as keyof SensorData] = item.value;
                }
                return acc;
            }, {} as SensorData);
            setSensorData(formattedData);
        } catch (error) {
            console.error('Không thể tải dữ liệu cảm biến!');
        } finally {
            setLoading(prev => ({ ...prev, sensors: false }));
        }

        // Lấy danh sách thiết bị
        try {
            setLoading(prev => ({ ...prev, devices: true }));
            const deviceResponse = await apiClient.get<Device[]>(`/farms/${farmId}/devices`);
            setDevices(deviceResponse.data);
        } catch (error) {
            message.error('Không thể tải danh sách thiết bị!');
        } finally {
            setLoading(prev => ({ ...prev, devices: false }));
        }

        // Lấy danh sách luật
        try {
            setLoading(prev => ({ ...prev, rules: true }));
            const ruleResponse = await apiClient.get<Rule[]>(`/farms/${farmId}/rules`);
            setRules(ruleResponse.data);
        } catch (error) {
            message.error('Không thể tải danh sách luật!');
        } finally {
            setLoading(prev => ({ ...prev, rules: false }));
        }
    }, [farmId]);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 10000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    // --- KẾT NỐI WEBSOCKET ---
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const decodedToken = parseJwt(token);
        const userId = decodedToken?.userId;

        if (!userId) {
            console.error("User ID not found in JWT token.");
            return;
        }

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                console.log('STOMP: ' + str);
            },
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            console.log('Connected to WebSocket!');
            client.subscribe(`/topic/notifications/${userId}`, (message) => {
                const notificationPayload = JSON.parse(message.body);
                notification.info({
                    message: `Thông báo từ hệ thống`,
                    description: notificationPayload.message,
                    placement: 'topRight',
                });
            });
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        client.activate();

        return () => {
            client.deactivate();
        };
    }, []);

    // --- XỬ LÝ THIẾT BỊ ---
    const showDeviceModal = (device: Device | null = null) => {
        if (device) {
            setEditingDevice(device);
            deviceForm.setFieldsValue(device);
        } else {
            setEditingDevice(null);
            deviceForm.resetFields();
        }
        setIsDeviceModalOpen(true);
    };

    const handleDeviceModalCancel = () => {
        setIsDeviceModalOpen(false);
        setEditingDevice(null);
        deviceForm.resetFields();
    };

    const handleDeviceFormSubmit = async (values: any) => {
        try {
            if (editingDevice) {
                await apiClient.put(`/farms/${farmId}/devices/${editingDevice.id}`, values);
                message.success('Cập nhật thiết bị thành công!');
            } else {
                await apiClient.post(`/farms/${farmId}/devices`, values);
                message.success('Thêm thiết bị thành công!');
            }
            handleDeviceModalCancel();
            fetchData();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || (editingDevice ? 'Cập nhật thất bại!' : 'Thêm thất bại!');
            message.error(errorMsg);
        }
    };

    const handleDeleteDevice = (device: Device) => {
        modal.confirm({
            title: `Bạn có chắc muốn xóa thiết bị "${device.name}"?`,
            icon: <ExclamationCircleOutlined />,
            content: 'Nếu thiết bị này đang được dùng trong quy tắc, quy tắc đó có thể sẽ không hoạt động.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await apiClient.delete(`/farms/${farmId}/devices/${device.id}`);
                    message.success('Đã xóa thiết bị.');
                    fetchData();
                } catch (error) {
                    message.error('Xóa thất bại!');
                }
            },
        });
    };

    // --- XỬ LÝ QUY TẮC ---
    const showRuleModal = (rule: Rule | null = null) => {
        if (rule) {
            setEditingRule(rule);
            ruleForm.setFieldsValue({
                ...rule,
                conditionValue: rule.conditionValue.toString()
            });
        } else {
            setEditingRule(null);
            ruleForm.resetFields();
        }
        setIsRuleModalOpen(true);
    };

    const handleRuleModalCancel = () => {
        setIsRuleModalOpen(false);
        setEditingRule(null);
        ruleForm.resetFields();
    };

    const handleRuleFormSubmit = async (values: any) => {
        const payload = {
            ...values,
            conditionValue: parseFloat(values.conditionValue)
        };
        try {
            if (editingRule) {
                await apiClient.put(`/farms/${farmId}/rules/${editingRule.id}`, payload);
                message.success('Cập nhật quy tắc thành công!');
            } else {
                await apiClient.post(`/farms/${farmId}/rules`, payload);
                message.success('Thêm quy tắc thành công!');
            }
            handleRuleModalCancel();
            fetchData();
        } catch (error) {
            message.error(editingRule ? 'Cập nhật thất bại!' : 'Thêm thất bại!');
        }
    };

    const handleDeleteRule = (rule: Rule) => {
        modal.confirm({
            title: `Bạn có chắc muốn xóa quy tắc "${rule.name}"?`,
            icon: <ExclamationCircleOutlined />,
            content: 'Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await apiClient.delete(`/farms/${farmId}/rules/${rule.id}`);
                    message.success('Đã xóa quy tắc.');
                    fetchData();
                } catch (error) {
                    message.error('Xóa thất bại!');
                }
            },
        });
    };

    // --- ĐIỀU KHIỂN THIẾT BỊ ---
    const handleControlDevice = async (deviceId: number, deviceIdentifier: string, command: 'TURN_ON' | 'TURN_OFF') => {
        try {
            await apiClient.post(`/farms/${farmId}/devices/${deviceId}/control`, { command });
            message.success(`Đã gửi lệnh ${command} tới thiết bị '${deviceIdentifier}'`);
        } catch (error) {
            message.error('Gửi lệnh thất bại!');
        }
    };

    // Lọc thiết bị
    const sensorDevices = devices.filter(d => d.type.toUpperCase().includes('SENSOR'));
    const actuatorDevices = devices.filter(d => !d.type.toUpperCase().includes('SENSOR'));

    const isLoading = loading.sensors || loading.devices || loading.rules;

    return (
        <Layout>
            <Content style={{ padding: '24px' }}>
                <PageHeader onBack={() => navigate('/farms')} title={`Chi tiết Nông trại #${farmId}`} />
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        {/* Thông số môi trường */}
                        <Title level={4}>Thông số môi trường</Title>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Thermometer size={48} color="#f5222d" />
                                    <Title level={3}>{sensorData.temperature?.toFixed(1) ?? 'N/A'} °C</Title>
                                    <Text>Nhiệt độ</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Droplet size={48} color="#1890ff" />
                                    <Title level={3}>{sensorData.humidity?.toFixed(1) ?? 'N/A'} %</Title>
                                    <Text>Độ ẩm không khí</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Droplet size={48} color="#52c41a" />
                                    <Title level={3}>{sensorData.soil_moisture?.toFixed(1) ?? 'N/A'} %</Title>
                                    <Text>Độ ẩm đất</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card>
                                    <Sun size={48} color="#faad14" />
                                    <Title level={3}>{sensorData.light?.toFixed(0) ?? 'N/A'} lux</Title>
                                    <Text>Ánh sáng</Text>
                                </Card>
                            </Col>
                        </Row>

                        <Divider />

                        {/* Bảng điều khiển */}
                        <Title level={4}>Bảng điều khiển</Title>
                        <Row gutter={[16, 16]}>
                            {actuatorDevices.map(device => (
                                <Col key={device.id} xs={24} sm={12} md={8}>
                                    <Card title={<><Zap size={16} /> {device.name}</>}>
                                        <Text>ID: {device.deviceIdentifier}</Text><br />
                                        <div style={{ marginTop: 16 }}>
                                            <Button type="primary" onClick={() => handleControlDevice(device.id, device.deviceIdentifier, 'TURN_ON')}>Bật</Button>
                                            <Button style={{ marginLeft: 8 }} onClick={() => handleControlDevice(device.id, device.deviceIdentifier, 'TURN_OFF')}>Tắt</Button>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        <Divider />

                        {/* Quản lý thiết bị và quy tắc */}
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Title level={4}>Danh sách thiết bị</Title>
                                    <Button icon={<PlusOutlined />} onClick={() => showDeviceModal()}>Thêm thiết bị</Button>
                                </div>
                                <List
                                    dataSource={devices}
                                    renderItem={item => (
                                        <List.Item
                                            actions={[
                                                <Button
                                                    key="edit"
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        showDeviceModal(item);
                                                    }}
                                                    style={{ padding: '4px 8px' }}
                                                />,
                                                <Button
                                                    key="delete"
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeleteDevice(item);
                                                    }}
                                                    style={{ padding: '4px 8px' }}
                                                />
                                            ]}
                                        >
                                            <List.Item.Meta title={item.name} description={`ID: ${item.deviceIdentifier}`} />
                                            <Tag color={item.type.includes('SENSOR') ? 'blue' : 'green'}>{item.type}</Tag>
                                        </List.Item>
                                    )}
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Title level={4}>Quy tắc tự động</Title>
                                    <Button icon={<PlusOutlined />} onClick={() => showRuleModal()}>Thêm quy tắc</Button>
                                </div>
                                <List
                                    dataSource={rules}
                                    renderItem={item => (
                                        <List.Item
                                            actions={[
                                                <Button
                                                    key="edit"
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        showRuleModal(item);
                                                    }}
                                                    style={{ padding: '4px 8px' }}
                                                />,
                                                <Button
                                                    key="delete"
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeleteRule(item);
                                                    }}
                                                    style={{ padding: '4px 8px' }}
                                                />
                                            ]}
                                        >
                                            <List.Item.Meta
                                                title={item.name}
                                                description={`Nếu ${item.conditionMetric} ${item.conditionOperator} ${item.conditionValue} thì ${item.actionType} thiết bị #${item.actuatorDeviceId}`}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Col>
                        </Row>
                    </>
                )}

                {/* MODAL THIẾT BỊ */}
                <Modal
                    title={editingDevice ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới"}
                    open={isDeviceModalOpen}
                    onOk={deviceForm.submit}
                    onCancel={handleDeviceModalCancel}
                    okText={editingDevice ? "Lưu" : "Thêm"}
                    cancelText="Hủy"
                >
                    <Form form={deviceForm} layout="vertical" onFinish={handleDeviceFormSubmit}>
                        <Form.Item name="name" label="Tên thiết bị" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                            <Input placeholder="Vd: Máy bơm số 1" />
                        </Form.Item>
                        <Form.Item name="deviceIdentifier" label="Định danh (Identifier)" rules={[{ required: true, message: 'Vui lòng nhập identifier!' }]}>
                            <Input placeholder="Vd: pump-01 (phải là duy nhất)" />
                        </Form.Item>
                        <Form.Item name="type" label="Loại thiết bị" rules={[{ required: true, message: 'Vui lòng chọn loại!' }]}>
                            <Select placeholder="Chọn loại thiết bị">
                                <Option value="PUMP">Máy bơm (PUMP)</Option>
                                <Option value="FAN">Quạt (FAN)</Option>
                                <Option value="LIGHT">Đèn (LIGHT)</Option>
                                <Option value="SENSOR_TEMPERATURE">Cảm biến nhiệt độ</Option>
                                <Option value="SENSOR_HUMIDITY">Cảm biến độ ẩm không khí</Option>
                                <Option value="SENSOR_SOIL_MOISTURE">Cảm biến độ ẩm đất</Option>
                                <Option value="SENSOR_LIGHT">Cảm biến ánh sáng</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* MODAL QUY TẮC */}
                <Modal
                    title={editingRule ? "Chỉnh sửa quy tắc" : "Thêm luật tự động mới"}
                    open={isRuleModalOpen}
                    onOk={ruleForm.submit}
                    onCancel={handleRuleModalCancel}
                    okText={editingRule ? "Lưu" : "Thêm"}
                    cancelText="Hủy"
                    width={600}
                >
                    <Form form={ruleForm} layout="vertical" onFinish={handleRuleFormSubmit}>
                        <Form.Item name="name" label="Tên luật" rules={[{ required: true }]}>
                            <Input placeholder="Vd: Tự động bật máy bơm khi đất khô" />
                        </Form.Item>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="sensorDeviceId" label="IF (Nếu cảm biến)" rules={[{ required: true }]}>
                                    <Select placeholder="Chọn cảm biến">
                                        {sensorDevices.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="conditionMetric" label="Đo lường" rules={[{ required: true }]}>
                                    <Select placeholder="Chọn thông số">
                                        <Option value="temperature">Nhiệt độ</Option>
                                        <Option value="humidity">Độ ẩm không khí</Option>
                                        <Option value="soil_moisture">Độ ẩm đất</Option>
                                        <Option value="light">Ánh sáng</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="conditionOperator" label="Toán tử" rules={[{ required: true }]}>
                                    <Select>
                                        <Option value=">">Lớn hơn (&gt;)</Option>
                                        <Option value="<">Nhỏ hơn (&lt;)</Option>
                                        <Option value="=">Bằng (=)</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={16}>
                                <Form.Item name="conditionValue" label="Giá trị ngưỡng" rules={[{ required: true }]}>
                                    <Input type="number" placeholder="Vd: 40" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="actuatorDeviceId" label="THEN (Thì điều khiển)" rules={[{ required: true }]}>
                                    <Select placeholder="Chọn thiết bị điều khiển">
                                        {actuatorDevices.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="actionType" label="Hành động" rules={[{ required: true }]}>
                                    <Select>
                                        <Option value="TURN_ON">Bật (TURN_ON)</Option>
                                        <Option value="TURN_OFF">Tắt (TURN_OFF)</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            </Content>
        </Layout>
    );
};

export default FarmDetailPage;