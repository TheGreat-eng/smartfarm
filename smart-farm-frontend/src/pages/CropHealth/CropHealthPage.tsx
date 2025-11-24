import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Progress, Alert, List, Spin, Tag, Breadcrumb, Button } from 'antd';
import { HeartPulse, Activity, Thermometer, Droplet, Sun, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import { useFarmContext } from '../../context/FarmContext';
import apiClient from '../../services/api';

const { Title, Text } = Typography;

interface HealthCheckResponse {
    score: number;
    status: string;
    issues: string[];
    cropName: string;
}

const CropHealthPage: React.FC = () => {
    const { selectedFarm } = useFarmContext();
    const navigate = useNavigate();
    const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Nếu chưa chọn farm thì đá về trang danh sách
    useEffect(() => {
        if (!selectedFarm) {
            navigate('/farms');
        }
    }, [selectedFarm, navigate]);

    // Hàm lấy dữ liệu sức khỏe
    const fetchHealthData = async () => {
        if (!selectedFarm) return;
        setLoading(true);
        try {
            const response = await apiClient.get<HealthCheckResponse>(`/farms/${selectedFarm.id}/health`);
            setHealthData(response.data);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu sức khỏe", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealthData();
        // Tự động cập nhật mỗi 30s
        const interval = setInterval(fetchHealthData, 30000);
        return () => clearInterval(interval);
    }, [selectedFarm]);

    if (!selectedFarm) return null;

    if (loading && !healthData) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" tip="Đang chẩn đoán cây trồng..." /></div>;
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Breadcrumb & Header */}
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item href="/farms"><HomeOutlined /> Danh sách</Breadcrumb.Item>
                <Breadcrumb.Item>{selectedFarm.name}</Breadcrumb.Item>
                <Breadcrumb.Item>Sức khỏe cây trồng</Breadcrumb.Item>
            </Breadcrumb>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate('/dashboard')} style={{ marginRight: 8 }} />
                <div>
                    <Title level={3} style={{ margin: 0 }}>Sức Khỏe Cây Trồng</Title>
                    <Text type="secondary">Chẩn đoán dựa trên dữ liệu cảm biến thời gian thực</Text>
                </div>
            </div>

            {healthData ? (
                <>
                    {/* KHỐI TỔNG QUAN */}
                    <Card style={{ marginBottom: 24, background: '#f9f9f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Activity color="#eb2f96" size={28} />
                            <Title level={4} style={{ margin: 0 }}>
                                Đang trồng: <Tag color="purple" style={{ fontSize: 16, padding: '4px 10px' }}>{healthData.cropName}</Tag>
                            </Title>
                        </div>
                    </Card>

                    <Row gutter={[24, 24]}>
                        {/* CỘT TRÁI: ĐIỂM SỐ */}
                        <Col xs={24} md={8}>
                            <Card bordered={false} style={{ height: '100%', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <div style={{ marginBottom: 24, fontWeight: 500, color: '#666' }}>CHỈ SỐ SỨC KHỎE TỔNG THỂ</div>
                                <Progress
                                    type="circle"
                                    percent={healthData.score}
                                    size={220}
                                    strokeWidth={12}
                                    strokeColor={
                                        healthData.score >= 80 ? '#52c41a' :
                                            healthData.score >= 50 ? '#faad14' : '#ff4d4f'
                                    }
                                    format={(percent) => (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ fontSize: 48, fontWeight: 'bold', color: '#333' }}>{percent}</span>
                                            <Tag style={{ marginTop: 8, fontSize: 16, padding: '4px 12px' }} color={healthData.score >= 80 ? 'success' : healthData.score >= 50 ? 'warning' : 'error'}>
                                                {healthData.status.toUpperCase()}
                                            </Tag>
                                        </div>
                                    )}
                                />
                                <div style={{ marginTop: 30, textAlign: 'left', padding: '0 20px' }}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        * Điểm số được tính dựa trên sự sai lệch giữa môi trường thực tế và điều kiện lý tưởng của <b>{healthData.cropName}</b>.
                                    </Text>
                                </div>
                            </Card>
                        </Col>

                        {/* CỘT PHẢI: CHI TIẾT VẤN ĐỀ */}
                        <Col xs={24} md={16}>
                            <Card
                                title={<span><HeartPulse size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: '#eb2f96' }} />Chẩn đoán chi tiết & Khuyến nghị</span>}
                                bordered={false}
                                style={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            >
                                {healthData.issues.length === 0 || (healthData.issues.length === 1 && healthData.issues[0].includes("ổn định")) ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <img src="https://cdn-icons-png.flaticon.com/512/1484/1484608.png" alt="Healthy" style={{ width: 80, marginBottom: 16, opacity: 0.8 }} />
                                        <Title level={4} style={{ color: '#52c41a' }}>Tuyệt vời!</Title>
                                        <Text>Cây trồng đang phát triển trong điều kiện môi trường lý tưởng.</Text>
                                    </div>
                                ) : (
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={healthData.issues}
                                        renderItem={(issue) => {
                                            // Xác định icon dựa trên nội dung lỗi
                                            let icon = <Activity size={20} />;
                                            if (issue.includes("Nhiệt độ")) icon = <Thermometer size={20} />;
                                            else if (issue.includes("Độ ẩm") || issue.includes("Đất")) icon = <Droplet size={20} />;
                                            else if (issue.includes("sáng")) icon = <Sun size={20} />;

                                            return (
                                                <List.Item>
                                                    <Alert
                                                        message={<span style={{ fontWeight: 600 }}>Phát hiện vấn đề</span>}
                                                        description={
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                                                                {icon}
                                                                {issue}
                                                            </div>
                                                        }
                                                        type={healthData.score < 50 ? "error" : "warning"}
                                                        showIcon
                                                        style={{ width: '100%', borderLeft: `5px solid ${healthData.score < 50 ? '#ff4d4f' : '#faad14'}` }}
                                                    />
                                                </List.Item>
                                            );
                                        }}
                                    />
                                )}
                            </Card>
                        </Col>
                    </Row>
                </>
            ) : (
                <Alert message="Chưa có dữ liệu" description="Vui lòng cấu hình loại cây trồng trong cài đặt nông trại." type="info" showIcon />
            )}
        </div>
    );
};

export default CropHealthPage;