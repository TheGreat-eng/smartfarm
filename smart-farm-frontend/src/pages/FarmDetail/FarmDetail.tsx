import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Layout, Typography, Button, message, Row, Col, Card, Spin, Divider,
    Modal, Form, Input, Select, List, Tag, notification
} from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { Thermometer, Droplet, Sun, Zap } from 'lucide-react';
import { PlusOutlined } from '@ant-design/icons';
import apiClient from '../../services/api';
// Thư viện để kết nối STOMP WebSocket (phù hợp với Spring Boot)
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// Định nghĩa các kiểu dữ liệu (TypeScript Interfaces)
interface SensorData {
    temperature?: number;
    humidity?: number;
    soil_moisture?: number; // Cập nhật cho đúng với simulator
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
    type: string; // "SENSOR_TEMPERATURE", "PUMP", etc.
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

const FarmDetailPage: React.FC = () => {
    const { farmId } = useParams<{ farmId: string }>();
    const navigate = useNavigate();

    // States cho dữ liệu
    const [sensorData, setSensorData] = useState<SensorData>({});
    const [devices, setDevices] = useState<Device[]>([]);
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState({
        sensors: true,
        devices: true,
        rules: true
    });

    // States cho các Modal (cửa sổ pop-up)
    const [isDeviceModalVisible, setIsDeviceModalVisible] = useState(false);
    const [isRuleModalVisible, setIsRuleModalVisible] = useState(false);
    const [deviceForm] = Form.useForm();
    const [ruleForm] = Form.useForm();


    // --- 1. HÀM LẤY DỮ LIỆU TỪ BACKEND ---
    const fetchData = useCallback(async () => {
        // Lấy dữ liệu cảm biến
        try {
            const sensorResponse = await apiClient.get<SensorDataResponse[]>(`/farms/${farmId}/sensordata/latest`);
            const formattedData: SensorData = sensorResponse.data.reduce((acc, item) => {
                acc[item.metricType as keyof SensorData] = item.value;
                return acc;
            }, {} as SensorData);
            setSensorData(formattedData);
        } catch (error) {
            console.error('Không thể tải dữ liệu cảm biến!');
        } finally {
            setLoading(prev => ({ ...prev, sensors: false }));
        }

        // Tạm thời dữ liệu giả cho devices và rules vì backend chưa có API GET
        // KHI BẠN THÊM API, HÃY BỎ COMMENT CÁC ĐOẠN DƯỚỚI
        setDevices([
            { id: 1, name: "Cảm biến DHT22", type: "SENSOR_TEMPERATURE", deviceIdentifier: "sensor-dht22-01" },
            { id: 2, name: "Máy bơm chính", type: "PUMP", deviceIdentifier: "pump-01" },
            { id: 3, name: "Cảm biến độ ẩm đất", type: "SENSOR_SOIL_MOISTURE", deviceIdentifier: "sensor-soil-01" },
        ]);
        setLoading(prev => ({ ...prev, devices: false }));
        setRules([
            { id: 1, name: "Tự động bơm khi đất khô", conditionMetric: "soil_moisture", conditionOperator: "<", conditionValue: 40, actionType: "TURN_ON", sensorDeviceId: 3, actuatorDeviceId: 2 },
        ]);
        setLoading(prev => ({ ...prev, rules: false }));

        /*
        // TODO: BỎ COMMENT KHI CÓ API
        // Lấy danh sách thiết bị
        try {
            const deviceResponse = await apiClient.get<Device[]>(`/farms/${farmId}/devices`);
            setDevices(deviceResponse.data);
        } catch (error) {
            message.error('Không thể tải danh sách thiết bị!');
        } finally {
            setLoading(prev => ({ ...prev, devices: false }));
        }

        // Lấy danh sách luật
        try {
            const ruleResponse = await apiClient.get<Rule[]>(`/farms/${farmId}/rules`);
            setRules(ruleResponse.data);
        } catch (error) {
            message.error('Không thể tải danh sách luật!');
        } finally {
            setLoading(prev => ({ ...prev, rules: false }));
        }
        */

    }, [farmId]);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 10000); // Cập nhật dữ liệu mỗi 10s
        return () => clearInterval(intervalId);
    }, [fetchData]);

    // --- 2. KẾT NỐI WEBSOCKET ---
    useEffect(() => {
        // TODO: Cần lấy userId từ JWT token, hiện đang giả lập là 1
        const userId = 1;
        const token = localStorage.getItem('authToken');

        if (!token) return;

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

        client.onConnect = (frame) => {
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


    // --- 3. HÀM XỬ LÝ LOGIC ---
    const handleControlDevice = async (deviceId: number, deviceIdentifier: string, command: 'TURN_ON' | 'TURN_OFF') => {
        try {
            await apiClient.post(`/farms/${farmId}/devices/${deviceId}/control`, { command });
            message.success(`Đã gửi lệnh ${command} tới thiết bị '${deviceIdentifier}'`);
        } catch (error) {
            message.error('Gửi lệnh thất bại!');
        }
    };

    const handleAddDevice = async (values: any) => {
        try {
            await apiClient.post(`/farms/${farmId}/devices`, values);
            message.success('Thêm thiết bị thành công!');
            setIsDeviceModalVisible(false);
            deviceForm.resetFields();
            fetchData(); // <-- TẢI LẠI DỮ LIỆU ĐỂ CẬP NHẬT GIAO DIỆN
        } catch (error) {
            message.error('Thêm thiết bị thất bại!');
        }
    };

    const handleAddRule = async (values: any) => {
        try {
            await apiClient.post(`/farms/${farmId}/rules`, values);
            message.success('Thêm luật thành công!');
            setIsRuleModalVisible(false);
            ruleForm.resetFields();
            fetchData(); // <-- TẢI LẠI DỮ LIỆU ĐỂ CẬP NHẬT GIAO DIỆN
        } catch (error) {
            message.error('Thêm luật thất bại!');
        }
    };

    // Lọc ra các thiết bị cảm biến và thiết bị điều khiển
    const sensorDevices = devices.filter(d => d.type.includes('SENSOR'));
    const actuatorDevices = devices.filter(d => !d.type.includes('SENSOR'));

    // --- 4. RENDER GIAO DIỆN ---
    const isLoading = loading.sensors || loading.devices || loading.rules;

    return (
        <Layout>
            <Content style={{ padding: '24px' }}>
                <PageHeader onBack={() => navigate('/farms')} title={`Chi tiết Nông trại #${farmId}`} />
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}> <Spin size="large" /> </div>
                ) : (
                    <>
                        {/* Phần hiển thị thông số môi trường */}
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

                        {/* Phần điều khiển thiết bị */}
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

                        {/* Phần quản lý thiết bị và luật */}
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Title level={4}>Danh sách thiết bị</Title>
                                    <Button icon={<PlusOutlined />} onClick={() => setIsDeviceModalVisible(true)}>Thêm thiết bị</Button>
                                </div>
                                <List
                                    dataSource={devices}
                                    renderItem={item => (
                                        <List.Item>
                                            <List.Item.Meta title={item.name} description={`ID: ${item.deviceIdentifier}`} />
                                            <Tag color={item.type.includes('SENSOR') ? 'blue' : 'green'}>{item.type}</Tag>
                                        </List.Item>
                                    )}
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Title level={4}>Luật tự động</Title>
                                    <Button icon={<PlusOutlined />} onClick={() => setIsRuleModalVisible(true)}>Thêm luật</Button>
                                </div>
                                <List
                                    dataSource={rules}
                                    renderItem={item => (
                                        <List.Item>
                                            <List.Item.Meta title={item.name} description={`Nếu ${item.conditionMetric} ${item.conditionOperator} ${item.conditionValue} thì ${item.actionType} thiết bị #${item.actuatorDeviceId}`} />
                                        </List.Item>
                                    )}
                                />
                            </Col>
                        </Row>
                    </>
                )}

                {/* Modal thêm thiết bị */}
                <Modal title="Thêm thiết bị mới" open={isDeviceModalVisible} onOk={deviceForm.submit} onCancel={() => setIsDeviceModalVisible(false)}>
                    <Form form={deviceForm} layout="vertical" onFinish={handleAddDevice}>
                        <Form.Item name="name" label="Tên thiết bị" rules={[{ required: true }]}>
                            <Input placeholder="Vd: Máy bơm số 1" />
                        </Form.Item>
                        <Form.Item name="deviceIdentifier" label="Định danh (Identifier)" rules={[{ required: true }]}>
                            <Input placeholder="Vd: pump-01 (phải là duy nhất)" />
                        </Form.Item>
                        <Form.Item name="type" label="Loại thiết bị" rules={[{ required: true }]}>
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

                {/* Modal thêm luật */}
                <Modal title="Thêm luật tự động mới" open={isRuleModalVisible} onOk={ruleForm.submit} onCancel={() => setIsRuleModalVisible(false)} width={600}>
                    <Form form={ruleForm} layout="vertical" onFinish={handleAddRule}>
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