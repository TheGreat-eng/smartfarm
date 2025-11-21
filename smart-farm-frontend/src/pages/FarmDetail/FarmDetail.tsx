// smart-farm-frontend/src/pages/FarmDetail/FarmDetail.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Layout, Typography, Button, message, Row, Col, Card, Spin, Divider,
    Modal, Form, Input, Select, List, Tag, notification, App, Statistic, Tabs
} from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { Thermometer, Droplet, Sun, Zap } from 'lucide-react';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, ControlOutlined, UnorderedListOutlined } from '@ant-design/icons';
import apiClient from '../../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import SensorChart from './SensorChart';

const { Title, Text } = Typography;
const { Option } = Select;

// Giữ nguyên các interface
interface SensorData { temperature?: number; humidity?: number; soil_moisture?: number; light?: number; }
interface HistoryDataPoint { time: string; value: number; }
interface HistoryDataState { temperature: HistoryDataPoint[]; humidity: HistoryDataPoint[]; soil_moisture: HistoryDataPoint[]; light: HistoryDataPoint[]; }
interface SensorDataResponse { metricType: string; value: number; time: string; }
interface Device { id: number; name: string; type: string; deviceIdentifier: string; }
interface Rule { id: number; name: string; conditionMetric: string; conditionOperator: string; conditionValue: number; actionType: string; sensorDeviceId: number; actuatorDeviceId: number; }

function parseJwt(token: string) { try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; } }

const FarmDetailPage: React.FC = () => {
    // ---- GIỮ NGUYÊN TẤT CẢ STATE VÀ LOGIC ----
    const { farmId } = useParams<{ farmId: string }>();
    const navigate = useNavigate();
    const { modal } = App.useApp();
    const [sensorData, setSensorData] = useState<SensorData>({});
    const [devices, setDevices] = useState<Device[]>([]);
    const [rules, setRules] = useState<Rule[]>([]);
    const [historyData, setHistoryData] = useState<HistoryDataState>({ temperature: [], humidity: [], soil_moisture: [], light: [] });
    const [loading, setLoading] = useState({ sensors: true, devices: true, rules: true, history: true });
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [deviceForm] = Form.useForm();
    const [ruleForm] = Form.useForm();

    const fetchHistoryData = useCallback(async () => {
        setLoading(prev => ({ ...prev, history: true }));
        try {
            const metrics: (keyof HistoryDataState)[] = ['temperature', 'humidity', 'soil_moisture', 'light'];
            const promises = metrics.map(metric => apiClient.get<HistoryDataPoint[]>(`/farms/${farmId}/sensordata/history`, { params: { metricType: metric, range: '24h' } }));
            const results = await Promise.all(promises);
            setHistoryData({ temperature: results[0].data, humidity: results[1].data, soil_moisture: results[2].data, light: results[3].data });
        } catch (error) { console.error("Không thể tải dữ liệu lịch sử!", error); }
        finally { setLoading(prev => ({ ...prev, history: false })); }
    }, [farmId]);

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
            const formattedData: SensorData = sensorResponse.data.reduce((acc, item) => {
                const key = item.metricType.toLowerCase();
                if (['temperature', 'humidity', 'soil_moisture', 'light'].includes(key)) acc[key as keyof SensorData] = item.value;
                return acc;
            }, {} as SensorData);
            setSensorData(formattedData); setLoading(prev => ({ ...prev, sensors: false }));
            setDevices(deviceResponse.data); setLoading(prev => ({ ...prev, devices: false }));
            setRules(ruleResponse.data); setLoading(prev => ({ ...prev, rules: false }));
        } catch (error) {
            message.error('Không thể tải dữ liệu nông trại!');
            setLoading({ sensors: false, devices: false, rules: false, history: false });
        }
    }, [farmId, fetchHistoryData]);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 60000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    useEffect(() => {
        const token = localStorage.getItem('authToken'); if (!token) return;
        const decodedToken = parseJwt(token); const userId = decodedToken?.userId; if (!userId) return;
        const client = new Client({ webSocketFactory: () => new SockJS('http://localhost:8080/ws'), connectHeaders: { Authorization: `Bearer ${token}` } });
        client.onConnect = () => client.subscribe(`/topic/notifications/${userId}`, msg => notification.info({ message: `Thông báo`, description: JSON.parse(msg.body).message, placement: 'topRight' }));
        client.activate();
        return () => client.deactivate();
    }, []);

    // Giữ nguyên các hàm xử lý modal và form (showDeviceModal, handle...Submit, handleDelete...)
    const showDeviceModal = (device: Device | null = null) => { setEditingDevice(device); if (device) deviceForm.setFieldsValue(device); else deviceForm.resetFields(); setIsDeviceModalOpen(true); };
    const handleDeviceModalCancel = () => { setIsDeviceModalOpen(false); setEditingDevice(null); deviceForm.resetFields(); };
    const handleDeviceFormSubmit = async (values: any) => { try { if (editingDevice) { await apiClient.put(`/farms/${farmId}/devices/${editingDevice.id}`, values); message.success('Cập nhật thiết bị thành công!'); } else { await apiClient.post(`/farms/${farmId}/devices`, values); message.success('Thêm thiết bị thành công!'); } handleDeviceModalCancel(); fetchData(); } catch (error: any) { message.error(error.response?.data?.message || 'Thao tác thất bại!'); } };
    const handleDeleteDevice = (device: Device) => { modal.confirm({ title: `Xóa thiết bị "${device.name}"?`, icon: <ExclamationCircleOutlined />, okText: 'Xóa', okType: 'danger', cancelText: 'Hủy', onOk: async () => { try { await apiClient.delete(`/farms/${farmId}/devices/${device.id}`); message.success('Đã xóa thiết bị.'); fetchData(); } catch (error) { message.error('Xóa thất bại!'); } } }); };
    const showRuleModal = (rule: Rule | null = null) => { setEditingRule(rule); if (rule) ruleForm.setFieldsValue({ ...rule, conditionValue: rule.conditionValue.toString() }); else ruleForm.resetFields(); setIsRuleModalOpen(true); };
    const handleRuleModalCancel = () => { setIsRuleModalOpen(false); setEditingRule(null); ruleForm.resetFields(); };
    const handleRuleFormSubmit = async (values: any) => { try { const payload = { ...values, conditionValue: parseFloat(values.conditionValue) }; if (editingRule) { await apiClient.put(`/farms/${farmId}/rules/${editingRule.id}`, payload); message.success('Cập nhật quy tắc thành công!'); } else { await apiClient.post(`/farms/${farmId}/rules`, payload); message.success('Thêm quy tắc thành công!'); } handleRuleModalCancel(); fetchData(); } catch (error) { message.error('Thao tác thất bại!'); } };
    const handleDeleteRule = (rule: Rule) => { modal.confirm({ title: `Xóa quy tắc "${rule.name}"?`, icon: <ExclamationCircleOutlined />, okText: 'Xóa', okType: 'danger', cancelText: 'Hủy', onOk: async () => { try { await apiClient.delete(`/farms/${farmId}/rules/${rule.id}`); message.success('Đã xóa quy tắc.'); fetchData(); } catch (error) { message.error('Xóa thất bại!'); } } }); };
    const handleControlDevice = async (deviceId: number, deviceIdentifier: string, command: 'TURN_ON' | 'TURN_OFF') => { try { await apiClient.post(`/farms/${farmId}/devices/${deviceId}/control`, { command }); message.success(`Đã gửi lệnh ${command} tới thiết bị '${deviceIdentifier}'`); } catch (error) { message.error('Gửi lệnh thất bại!'); } };

    const sensorDevices = devices.filter(d => d.type.toUpperCase().includes('SENSOR'));
    const actuatorDevices = devices.filter(d => !d.type.toUpperCase().includes('SENSOR'));

    // --- BẮT ĐẦU PHẦN GIAO DIỆN MỚI ---
    return (
        <Spin spinning={loading.sensors || loading.devices || loading.rules} tip="Đang tải dữ liệu...">
            <PageHeader
                onBack={() => navigate('/farms')}
                title={`Dashboard Nông trại #${farmId}`}
                subTitle="Tổng quan các chỉ số và điều khiển"
            />
            <Divider />

            {/* DÒNG 1: THÔNG SỐ TỨC THỜI */}
            <Title level={4}>Thông số môi trường</Title>
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card><Statistic title="Nhiệt độ" value={sensorData.temperature?.toFixed(1)} suffix="°C" prefix={<Thermometer color="#f5222d" />} /></Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card><Statistic title="Độ ẩm không khí" value={sensorData.humidity?.toFixed(1)} suffix="%" prefix={<Droplet color="#1890ff" />} /></Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card><Statistic title="Độ ẩm đất" value={sensorData.soil_moisture?.toFixed(1)} suffix="%" prefix={<Droplet color="#52c41a" />} /></Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card><Statistic title="Ánh sáng" value={sensorData.light?.toFixed(0)} suffix="lux" prefix={<Sun color="#faad14" />} /></Card>
                </Col>
            </Row>

            <Divider />

            {/* DÒNG 2: BIỂU ĐỒ LỊCH SỬ */}
            <Title level={4}>Lịch sử thông số (24 giờ qua)</Title>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}><Card title="Nhiệt độ (°C)"><SensorChart data={historyData.temperature} lineColor="#f5222d" metricName="Nhiệt độ" unit="°C" loading={loading.history} /></Card></Col>
                <Col xs={24} lg={12}><Card title="Độ ẩm không khí (%)"><SensorChart data={historyData.humidity} lineColor="#1890ff" metricName="Độ ẩm" unit="%" loading={loading.history} /></Card></Col>
                <Col xs={24} lg={12}><Card title="Độ ẩm đất (%)"><SensorChart data={historyData.soil_moisture} lineColor="#52c41a" metricName="Độ ẩm đất" unit="%" loading={loading.history} /></Card></Col>
                <Col xs={24} lg={12}><Card title="Ánh sáng (lux)"><SensorChart data={historyData.light} lineColor="#faad14" metricName="Ánh sáng" unit="lux" loading={loading.history} /></Card></Col>
            </Row>

            <Divider />

            {/* DÒNG 3: ĐIỀU KHIỂN VÀ QUẢN LÝ */}
            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Title level={4}>Bảng điều khiển</Title>
                    <Card>
                        <List
                            itemLayout="horizontal"
                            dataSource={actuatorDevices}
                            renderItem={(device) => (
                                <List.Item
                                    actions={[
                                        <Button size="small" onClick={() => handleControlDevice(device.id, device.deviceIdentifier, 'TURN_ON')}>Bật</Button>,
                                        <Button size="small" danger onClick={() => handleControlDevice(device.id, device.deviceIdentifier, 'TURN_OFF')}>Tắt</Button>
                                    ]}
                                >
                                    <List.Item.Meta avatar={<Zap size={20} />} title={device.name} description={`ID: ${device.deviceIdentifier}`} />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Title level={4}>Quản lý</Title>
                    <Card>
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
                            <Tabs.TabPane tab={<span><ControlOutlined /> Quy tắc</span>} key="2">
                                <Button icon={<PlusOutlined />} onClick={() => showRuleModal()} style={{ marginBottom: 16 }}>Thêm quy tắc</Button>
                                <List
                                    dataSource={rules}
                                    renderItem={item => (
                                        <List.Item actions={[<Button type="text" icon={<EditOutlined />} onClick={() => showRuleModal(item)} />, <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRule(item)} />]}>
                                            <List.Item.Meta title={item.name} description={`Nếu ${item.conditionMetric} ${item.conditionOperator} ${item.conditionValue} thì ${item.actionType} thiết bị #${item.actuatorDeviceId}`} />
                                        </List.Item>
                                    )}
                                />
                            </Tabs.TabPane>
                        </Tabs>
                    </Card>
                </Col>
            </Row>

            {/* ---- CÁC MODAL GIỮ NGUYÊN ---- */}
            {/* Modal Thiết bị */}
            <Modal title={editingDevice ? "Chỉnh sửa thiết bị" : "Thêm thiết bị"} open={isDeviceModalOpen} onOk={deviceForm.submit} onCancel={handleDeviceModalCancel} okText={editingDevice ? "Lưu" : "Thêm"}>
                <Form form={deviceForm} layout="vertical" onFinish={handleDeviceFormSubmit}>
                    <Form.Item name="name" label="Tên thiết bị" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="deviceIdentifier" label="Định danh (Identifier)" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="type" label="Loại thiết bị" rules={[{ required: true }]}>
                        <Select>
                            <Option value="PUMP">Máy bơm (PUMP)</Option> <Option value="FAN">Quạt (FAN)</Option> <Option value="LIGHT">Đèn (LIGHT)</Option>
                            <Option value="SENSOR_TEMPERATURE">Cảm biến nhiệt độ</Option> <Option value="SENSOR_HUMIDITY">Cảm biến độ ẩm không khí</Option>
                            <Option value="SENSOR_SOIL_MOISTURE">Cảm biến độ ẩm đất</Option> <Option value="SENSOR_LIGHT">Cảm biến ánh sáng</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
            {/* Modal Quy tắc */}
            <Modal title={editingRule ? "Chỉnh sửa quy tắc" : "Thêm quy tắc"} open={isRuleModalOpen} onOk={ruleForm.submit} onCancel={handleRuleModalCancel} okText={editingRule ? "Lưu" : "Thêm"} width={600}>
                <Form form={ruleForm} layout="vertical" onFinish={handleRuleFormSubmit}>
                    <Form.Item name="name" label="Tên luật" rules={[{ required: true }]}><Input /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="sensorDeviceId" label="IF (Cảm biến)" rules={[{ required: true }]}><Select>{sensorDevices.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}</Select></Form.Item></Col>
                        <Col span={12}><Form.Item name="conditionMetric" label="Đo lường" rules={[{ required: true }]}><Select><Option value="temperature">Nhiệt độ</Option><Option value="humidity">Độ ẩm không khí</Option><Option value="soil_moisture">Độ ẩm đất</Option><Option value="light">Ánh sáng</Option></Select></Form.Item></Col>
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

export default FarmDetailPage;