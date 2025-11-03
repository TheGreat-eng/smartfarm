import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Typography, Button, message, Row, Col, Card, Spin } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { Thermometer, Droplet, Sun } from 'lucide-react'; // Thư viện icon đẹp, nhẹ
import apiClient from '../../services/api';



const { Content } = Layout;


// Định nghĩa kiểu dữ liệu cho state
interface SensorData {
    temperature?: number;
    humidity?: number;
    light?: number;
}

// Định nghĩa kiểu dữ liệu API trả về
interface SensorDataResponse {
    metricType: string;
    value: number;
    time: string;
}

const FarmDetailPage: React.FC = () => {
    // Lấy farmId từ URL, ví dụ: /farms/123
    const { farmId } = useParams<{ farmId: string }>();
    const [sensorData, setSensorData] = useState<SensorData>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.get<SensorDataResponse[]>(`/farms/${farmId}/sensordata/latest`);

                // Chuyển đổi mảng dữ liệu thành một object dễ sử dụng
                const formattedData: SensorData = response.data.reduce((acc, item) => {
                    if (item.metricType.includes('temperature')) acc.temperature = item.value;
                    if (item.metricType.includes('humidity')) acc.humidity = item.value;
                    if (item.metricType.includes('light')) acc.light = item.value;
                    return acc;
                }, {} as SensorData);

                setSensorData(formattedData);
            } catch (error) {
                message.error('Không thể tải dữ liệu cảm biến!');
            } finally {
                setLoading(false);
            }
        };

        fetchData(); // Gọi lần đầu ngay lập tức

        // Thiết lập interval để gọi lại API sau mỗi 5 giây
        const intervalId = setInterval(fetchData, 5000);

        // Cleanup: Xóa interval khi component bị unmount
        return () => clearInterval(intervalId);

    }, [farmId]); // Dependency array: useEffect sẽ chạy lại nếu farmId thay đổi

    // Hàm xử lý khi nhấn nút điều khiển
    const handleControlDevice = async (deviceId: number, command: 'TURN_ON' | 'TURN_OFF') => {
        try {
            await apiClient.post(`/devices/${deviceId}/control`, { command });
            message.success(`Đã gửi lệnh ${command} tới thiết bị #${deviceId}`);
        } catch (error) {
            message.error('Gửi lệnh thất bại!');
            console.error('Control device error:', error);
        }
    };

    return (
        <Layout>
            <Content style={{ padding: '24px' }}>
                <PageHeader
                    onBack={() => window.history.back()}
                    title={`Chi tiết Nông trại #${farmId}`}
                    subTitle="Dữ liệu môi trường và bảng điều khiển"
                />

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <div style={{ background: '#f0f2f5', padding: 24, minHeight: 280 }}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={8}>
                                <Card>
                                    <Thermometer size={48} color="#f5222d" />
                                    <Typography.Title level={3}>{sensorData.temperature?.toFixed(1) ?? 'N/A'} °C</Typography.Title>
                                    <Typography.Text>Nhiệt độ không khí</Typography.Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card>
                                    <Droplet size={48} color="#1890ff" />
                                    <Typography.Title level={3}>{sensorData.humidity?.toFixed(1) ?? 'N/A'} %</Typography.Title>
                                    <Typography.Text>Độ ẩm đất</Typography.Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card>
                                    <Sun size={48} color="#faad14" />
                                    <Typography.Title level={3}>{sensorData.light?.toFixed(0) ?? 'N/A'} lux</Typography.Title>
                                    <Typography.Text>Cường độ ánh sáng</Typography.Text>
                                </Card>
                            </Col>
                        </Row>

                        <Typography.Title level={4} style={{ marginTop: '32px' }}>Bảng điều khiển thiết bị</Typography.Title>
                        {/* Giả sử máy bơm có ID=1, bạn sẽ cần lấy ID này động sau này */}
                        <Button type="primary" onClick={() => handleControlDevice(2, 'TURN_ON')}>
                            Bật máy bơm
                        </Button>
                        <Button style={{ marginLeft: '8px' }} onClick={() => handleControlDevice(2, 'TURN_OFF')}>
                            Tắt máy bơm
                        </Button>
                    </div>
                )}
            </Content>
        </Layout>
    );
};

export default FarmDetailPage;