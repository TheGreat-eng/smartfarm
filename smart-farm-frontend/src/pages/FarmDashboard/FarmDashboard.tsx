import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography, Button, message, Row, Col, Card, Spin, Divider,
    Modal, Form, Input, Select, List, Tag, notification, App, Statistic, Tabs, Breadcrumb
} from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { Thermometer, Droplet, Sun, Zap, ArrowLeft } from 'lucide-react';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined,
    ControlOutlined, UnorderedListOutlined, HomeOutlined
} from '@ant-design/icons';
import apiClient from '../../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import SensorChart from '../FarmList/SensorChart' // Đảm bảo đường dẫn import đúng file Chart cũ
import { useFarmContext } from '../../context/FarmContext'; // IMPORT CONTEXT

const { Title } = Typography;
const { Option } = Select;

// --- Interfaces ---
interface SensorData { temperature?: number; humidity?: number; soil_moisture?: number; light?: number; }
interface HistoryDataPoint { time: string; value: number; }
interface HistoryDataState { temperature: HistoryDataPoint[]; humidity: HistoryDataPoint[]; soil_moisture: HistoryDataPoint[]; light: HistoryDataPoint[]; }
interface SensorDataResponse { metricType: string; value: number; time: string; }
interface Device { id: number; name: string; type: string; deviceIdentifier: string; }
interface Rule { id: number; name: string; conditionMetric: string; conditionOperator: string; conditionValue: number; actionType: string; sensorDeviceId: number; actuatorDeviceId: number; }

// --- Helper: Decode JWT ---
function parseJwt(token: string) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

const FarmDashboard: React.FC = () => {
    // 1. Lấy nông trại từ Context thay vì URL
    const { selectedFarm } = useFarmContext();
    const navigate = useNavigate();
    const { modal } = App.useApp();

    // 2. Kiểm tra nếu chưa chọn nông trại thì đá về trang danh sách
    useEffect(() => {
        if (!selectedFarm) {
            message.warning('Vui lòng chọn nông trại cần xem!');
            navigate('/farms');
        }
    }, [selectedFarm, navigate]);

    // Data States
    const [sensorData, setSensorData] = useState<SensorData>({});
    const [devices, setDevices] = useState<Device[]>([]);
    const [rules, setRules] = useState<Rule[]>([]);
    const [historyData, setHistoryData] = useState<HistoryDataState>({ temperature: [], humidity: [], soil_moisture: [], light: [] });
    const [loading, setLoading] = useState({ sensors: true, devices: true, rules: true, history: true });

    // Modal States
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

    // Forms
    const [deviceForm] = Form.useForm();
    const [ruleForm] = Form.useForm();

    // Nếu selectedFarm chưa có (đang redirect) thì return null để tránh lỗi crash
    if (!selectedFarm) return null;

    // Lấy ID để dùng cho các hàm bên dưới
    const farmId = selectedFarm.id;

    // --- CÁC HÀM FETCH DỮ LIỆU ---

    // Lấy dữ liệu lịch sử
    const fetchHistoryData = useCallback(async () => {
        setLoading(prev => ({ ...prev, history: true }));
        try {
            const metrics: (keyof HistoryDataState)[] = ['temperature', 'humidity', 'soil_moisture', 'light'];
            const promises = metrics.map(metric => apiClient.get<HistoryDataPoint[]>(`/farms/${farmId}/sensordata/history`, { params: { metricType: metric, range: '24h' } }));
            const results = await Promise.all(promises);
            setHistoryData({ temperature: results[0].data, humidity: results[1].data, soil_moisture: results[2].data, light: results[3].data });
        } catch (error) {
            console.error("Không thể tải dữ liệu lịch sử!", error);
        } finally {
            setLoading(prev => ({ ...prev, history: false }));
        }
    }, [farmId]);

    // Lấy dữ liệu tổng hợp
    const fetchData = useCallback(async () => {
        setLoading(prev => ({ ...prev, sensors: true, devices: true, rules: true }));
        const promises = [
            apiClient.get<SensorDataResponse[]>(`/farms/${farmId}/sensordata/latest`),
            apiClient.get<Device[]>(`/farms/${farmId}/devices`),
            apiClient.get<Rule[]>(`/farms/${farmId}/rules`),
            fetchHistoryData()
        ];
        try {
            const [sensorResponse, deviceResponse, ruleResponse] = await Promise.all(promises.slice(0, 3));

            // Format Sensor Data
            const formattedData: SensorData = sensorResponse.data.reduce((acc, item) => {
                const key = item.metricType.toLowerCase();
                if (['temperature', 'humidity', 'soil_moisture', 'light'].includes(key)) {
                    acc[key as keyof SensorData] = item.value;
                }
                return acc;
            }, {} as SensorData);

            setSensorData(formattedData);
            setLoading(prev => ({ ...prev, sensors: false }));

            setDevices(deviceResponse.data);
            setLoading(prev => ({ ...prev, devices: false }));

            setRules(ruleResponse.data);
            setLoading(prev => ({ ...prev, rules: false }));

        } catch (error) {
            message.error('Không thể tải dữ liệu nông trại!');
            setLoading({ sensors: false, devices: false, rules: false, history: false });
        }
    }, [farmId, fetchHistoryData]);

    // Effect khởi chạy
    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 60000); // Refresh mỗi 60s
        return () => clearInterval(intervalId);
    }, [fetchData]); // Khi farmId thay đổi (do chọn farm khác), useEffect này chạy lại

    // WebSocket Notification
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const decodedToken = parseJwt(token);
        const userId = decodedToken?.userId || decodedToken?.sub;

        if (!userId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                client.subscribe(`/topic/notifications/${userId}`, (msg) => {
                    if (msg.body) {
                        const notificationBody = JSON.parse(msg.body);
                        notification.info({
                            message: 'Thông báo hệ thống',
                            description: notificationBody.message,
                            placement: 'topRight'
                        });
                    }
                });
            },
        });

        client.activate();

        return () => {
            if (client.active) {
                void client.deactivate();
            }
        };
    }, []);

    // --- Handlers ---
    const showDeviceModal = (device: Device | null = null) => { setEditingDevice(device); if (device) deviceForm.setFieldsValue(device); else deviceForm.resetFields(); setIsDeviceModalOpen(true); };
    const handleDeviceModalCancel = () => { setIsDeviceModalOpen(false); setEditingDevice(null); deviceForm.resetFields(); };
    const handleDeviceFormSubmit = async (values: any) => { try { if (editingDevice) { await apiClient.put(`/farms/${farmId}/devices/${editingDevice.id}`, values); message.success('Cập nhật thành công!'); } else { await apiClient.post(`/farms/${farmId}/devices`, values); message.success('Thêm thành công!'); } handleDeviceModalCancel(); fetchData(); } catch (error: any) { message.error(error.response?.data?.message || 'Thất bại!'); } };
    const handleDeleteDevice = (device: Device) => { modal.confirm({ title: `Xóa "${device.name}"?`, icon: <ExclamationCircleOutlined />, okText: 'Xóa', okType: 'danger', onOk: async () => { try { await apiClient.delete(`/farms/${farmId}/devices/${device.id}`); message.success('Đã xóa.'); fetchData(); } catch (error) { message.error('Xóa thất bại!'); } } }); };

    const showRuleModal = (rule: Rule | null = null) => { setEditingRule(rule); if (rule) ruleForm.setFieldsValue({ ...rule, conditionValue: rule.conditionValue.toString() }); else ruleForm.resetFields(); setIsRuleModalOpen(true); };
    const handleRuleModalCancel = () => { setIsRuleModalOpen(false); setEditingRule(null); ruleForm.resetFields(); };
    const handleRuleFormSubmit = async (values: any) => { try { const payload = { ...values, conditionValue: parseFloat(values.conditionValue) }; if (editingRule) { await apiClient.put(`/farms/${farmId}/rules/${editingRule.id}`, payload); message.success('Cập nhật thành công!'); } else { await apiClient.post(`/farms/${farmId}/rules`, payload); message.success('Thêm thành công!'); } handleRuleModalCancel(); fetchData(); } catch (error) { message.error('Thất bại!'); } };
    const handleDeleteRule = (rule: Rule) => { modal.confirm({ title: `Xóa quy tắc "${rule.name}"?`, icon: <ExclamationCircleOutlined />, okText: 'Xóa', okType: 'danger', onOk: async () => { try { await apiClient.delete(`/farms/${farmId}/rules/${rule.id}`); message.success('Đã xóa.'); fetchData(); } catch (error) { message.error('Xóa thất bại!'); } } }); };

    const handleControlDevice = async (deviceId: number, deviceIdentifier: string, command: 'TURN_ON' | 'TURN_OFF') => {
        try {
            await apiClient.post(`/farms/${farmId}/devices/${deviceId}/control`, { command });
            message.success(`Đã gửi lệnh ${command} tới ${deviceIdentifier}`);
        } catch (error) {
            message.error('Gửi lệnh thất bại!');
        }
    };

    const sensorDevices = devices.filter(d => d.type.toUpperCase().includes('SENSOR'));
    const actuatorDevices = devices.filter(d => !d.type.toUpperCase().includes('SENSOR'));

    // --- Render ---
    return (
        <Spin spinning={loading.sensors} tip="Đang tải dữ liệu...">
            {/* Breadcrumb - Dùng tên nông trại từ Context */}
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item href="/farms">
                    <HomeOutlined /> Danh sách
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    {selectedFarm.name}
                </Breadcrumb.Item>
                <Breadcrumb.Item>Dashboard Tổng</Breadcrumb.Item>
            </Breadcrumb>

            <PageHeader
                onBack={() => navigate('/farms')}
                backIcon={<Button icon={<ArrowLeft size={16} />} type="text">Chọn nông trại khác</Button>}
                title={<Title level={3} style={{ margin: 0 }}>Dashboard: {selectedFarm.name}</Title>}
                subTitle={`Vị trí: ${selectedFarm.location}`}
                style={{ padding: 0, marginBottom: 24 }}
            />

            {/* Row 1: Thống kê */}
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderColor: '#ffccc7' }}>
                        <Statistic title="Nhiệt độ" value={sensorData.temperature?.toFixed(1) ?? '--'} suffix="°C" prefix={<Thermometer color="#f5222d" />} valueStyle={{ color: '#f5222d' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderColor: '#bae7ff' }}>
                        <Statistic title="Độ ẩm không khí" value={sensorData.humidity?.toFixed(1) ?? '--'} suffix="%" prefix={<Droplet color="#1890ff" />} valueStyle={{ color: '#1890ff' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderColor: '#d9f7be' }}>
                        <Statistic title="Độ ẩm đất" value={sensorData.soil_moisture?.toFixed(1) ?? '--'} suffix="%" prefix={<Droplet color="#52c41a" />} valueStyle={{ color: '#52c41a' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card hoverable style={{ borderColor: '#ffe7ba' }}>
                        <Statistic title="Ánh sáng" value={sensorData.light?.toFixed(0) ?? '--'} suffix="lux" prefix={<Sun color="#faad14" />} valueStyle={{ color: '#faad14' }} />
                    </Card>
                </Col>
            </Row>

            <Divider orientation="left">Biểu đồ theo dõi (24h)</Divider>

            {/* Row 2: Charts */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}><Card title="Nhiệt độ (°C)"><SensorChart data={historyData.temperature} lineColor="#f5222d" metricName="Nhiệt độ" unit="°C" loading={loading.history} /></Card></Col>
                <Col xs={24} lg={12}><Card title="Độ ẩm không khí (%)"><SensorChart data={historyData.humidity} lineColor="#1890ff" metricName="Độ ẩm" unit="%" loading={loading.history} /></Card></Col>
                <Col xs={24} lg={12}><Card title="Độ ẩm đất (%)"><SensorChart data={historyData.soil_moisture} lineColor="#52c41a" metricName="Độ ẩm đất" unit="%" loading={loading.history} /></Card></Col>
                <Col xs={24} lg={12}><Card title="Ánh sáng (lux)"><SensorChart data={historyData.light} lineColor="#faad14" metricName="Ánh sáng" unit="lux" loading={loading.history} /></Card></Col>
            </Row>

            <Divider orientation="left">Điều khiển & Cấu hình</Divider>

            {/* Row 3: Control & Settings */}
            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card title="Điều khiển thủ công" bordered={false} style={{ height: '100%' }}>
                        <List
                            itemLayout="horizontal"
                            dataSource={actuatorDevices}
                            renderItem={(device) => (
                                <List.Item
                                    actions={[
                                        <Button type="primary" size="small" onClick={() => handleControlDevice(device.id, device.deviceIdentifier, 'TURN_ON')}>Bật</Button>,
                                        <Button size="small" danger onClick={() => handleControlDevice(device.id, device.deviceIdentifier, 'TURN_OFF')}>Tắt</Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={<Zap size={20} color="#faad14" />}
                                        title={device.name}
                                        description={<Tag>{device.deviceIdentifier}</Tag>}
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: 'Chưa có thiết bị điều khiển' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card bordered={false} style={{ height: '100%' }}>
                        <Tabs defaultActiveKey="1">
                            <Tabs.TabPane tab={<span><UnorderedListOutlined /> Thiết bị</span>} key="1">
                                <Button icon={<PlusOutlined />} onClick={() => showDeviceModal()} style={{ marginBottom: 16 }}>Thêm thiết bị</Button>
                                <List
                                    dataSource={devices}
                                    renderItem={item => (
                                        <List.Item actions={[<Button type="text" icon={<EditOutlined />} onClick={() => showDeviceModal(item)} />, <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDevice(item)} />]}>
                                            <List.Item.Meta title={item.name} description={`ID: ${item.deviceIdentifier}`} />
                                            <Tag color={item.type.includes('SENSOR') ? 'blue' : 'green'}>{item.type}</Tag>
                                        </List.Item>
                                    )}
                                />
                            </Tabs.TabPane>
                            <Tabs.TabPane tab={<span><ControlOutlined /> Quy tắc Tự động</span>} key="2">
                                <Button icon={<PlusOutlined />} onClick={() => showRuleModal()} style={{ marginBottom: 16 }}>Thêm quy tắc</Button>
                                <List
                                    dataSource={rules}
                                    renderItem={item => (
                                        <List.Item actions={[<Button type="text" icon={<EditOutlined />} onClick={() => showRuleModal(item)} />, <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRule(item)} />]}>
                                            <List.Item.Meta title={item.name} description={<span>Nếu <b>{item.conditionMetric}</b> {item.conditionOperator} {item.conditionValue} thì <b>{item.actionType}</b> thiết bị ID:{item.actuatorDeviceId}</span>} />
                                        </List.Item>
                                    )}
                                />
                            </Tabs.TabPane>
                        </Tabs>
                    </Card>
                </Col>
            </Row>

            {/* Modals */}
            <Modal title={editingDevice ? "Sửa thiết bị" : "Thêm thiết bị"} open={isDeviceModalOpen} onOk={deviceForm.submit} onCancel={handleDeviceModalCancel} okText={editingDevice ? "Lưu" : "Thêm"}>
                <Form form={deviceForm} layout="vertical" onFinish={handleDeviceFormSubmit}>
                    <Form.Item name="name" label="Tên thiết bị" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="deviceIdentifier" label="Định danh (Identifier)" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="type" label="Loại thiết bị" rules={[{ required: true }]}>
                        <Select>
                            <Option value="PUMP">Máy bơm</Option> <Option value="FAN">Quạt</Option> <Option value="LIGHT">Đèn</Option>
                            <Option value="SENSOR_TEMPERATURE">Cảm biến nhiệt độ</Option> <Option value="SENSOR_HUMIDITY">Cảm biến độ ẩm KK</Option>
                            <Option value="SENSOR_SOIL_MOISTURE">Cảm biến độ ẩm đất</Option> <Option value="SENSOR_LIGHT">Cảm biến ánh sáng</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title={editingRule ? "Sửa quy tắc" : "Thêm quy tắc"} open={isRuleModalOpen} onOk={ruleForm.submit} onCancel={handleRuleModalCancel} okText={editingRule ? "Lưu" : "Thêm"} width={600}>
                <Form form={ruleForm} layout="vertical" onFinish={handleRuleFormSubmit}>
                    <Form.Item name="name" label="Tên luật" rules={[{ required: true }]}><Input /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="sensorDeviceId" label="IF (Cảm biến)" rules={[{ required: true }]}><Select>{sensorDevices.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}</Select></Form.Item></Col>
                        <Col span={12}><Form.Item name="conditionMetric" label="Đo lường" rules={[{ required: true }]}><Select><Option value="temperature">Nhiệt độ</Option><Option value="humidity">Độ ẩm KK</Option><Option value="soil_moisture">Độ ẩm đất</Option><Option value="light">Ánh sáng</Option></Select></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="conditionOperator" label="Toán tử" rules={[{ required: true }]}><Select><Option value=">">&gt;</Option><Option value="<">&lt;</Option><Option value="=">=</Option></Select></Form.Item></Col>
                        <Col span={16}><Form.Item name="conditionValue" label="Giá trị ngưỡng" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="actuatorDeviceId" label="THEN (Điều khiển)" rules={[{ required: true }]}><Select>{actuatorDevices.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}</Select></Form.Item></Col>
                        <Col span={12}><Form.Item name="actionType" label="Hành động" rules={[{ required: true }]}><Select><Option value="TURN_ON">Bật</Option><Option value="TURN_OFF">Tắt</Option></Select></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>
        </Spin>
    );
};

export default FarmDashboard;