import React, { useEffect, useState } from 'react';
import { Card, Typography, Row, Col, Spin, Alert, Divider, Statistic, message } from 'antd';
import { CloudOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Wind, Droplet, Thermometer, Eye } from 'lucide-react';
import axios from 'axios';
import { useFarmContext } from '../../context/FarmContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// --- CẤU HÌNH API ---
// Bạn hãy thay thế bằng API Key của bạn từ OpenWeatherMap
const API_KEY = '1c056db31e6e68a80ae0a67ed59bd705';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const WeatherPage: React.FC = () => {
    const { selectedFarm } = useFarmContext();
    const navigate = useNavigate();

    const [weather, setWeather] = useState<any>(null);
    const [forecast, setForecast] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Kiểm tra nếu chưa chọn nông trại
    useEffect(() => {
        if (!selectedFarm) {
            navigate('/farms');
        }
    }, [selectedFarm, navigate]);

    // Gọi API Thời tiết
    useEffect(() => {
        const fetchWeather = async () => {
            if (!selectedFarm?.location) return;

            setLoading(true);
            setError(null);
            try {
                // 1. Lấy thời tiết hiện tại
                // q={location}: Tên thành phố/tỉnh (VD: Hanoi, Dalat, Lam Dong)
                // units=metric: Đổi sang độ C
                // lang=vi: Tiếng Việt
                const currentRes = await axios.get(`${BASE_URL}/weather`, {
                    params: {
                        q: selectedFarm.location,
                        appid: API_KEY,
                        units: 'metric',
                        lang: 'vi'
                    }
                });

                // 2. Lấy dự báo 5 ngày (OpenWeatherMap free trả về mỗi 3 giờ)
                const forecastRes = await axios.get(`${BASE_URL}/forecast`, {
                    params: {
                        q: selectedFarm.location,
                        appid: API_KEY,
                        units: 'metric',
                        lang: 'vi'
                    }
                });

                setWeather(currentRes.data);

                // Lọc dự báo: Chỉ lấy 1 mốc thời gian mỗi ngày (ví dụ lúc 12:00 trưa) để hiển thị cho gọn
                const dailyForecast = forecastRes.data.list.filter((reading: any) =>
                    reading.dt_txt.includes("12:00:00")
                );
                setForecast(dailyForecast);

            } catch (err: any) {
                console.error(err);
                if (err.response?.status === 404) {
                    setError(`Không tìm thấy thông tin thời tiết cho địa điểm: "${selectedFarm.location}". Vui lòng kiểm tra lại tên vị trí trong phần sửa nông trại (Nên dùng tên thành phố không dấu hoặc tiếng Anh, ví dụ: Hanoi, Dalat).`);
                } else {
                    setError('Không thể tải dữ liệu thời tiết. Vui lòng thử lại sau.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [selectedFarm]);

    if (!selectedFarm) return null;

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spin size="large" tip="Đang tải dự báo thời tiết..." />
            </div>
        );
    }

    return (
        <div className="weather-page">
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Dự báo thời tiết</Title>
                <Text type="secondary">
                    <EnvironmentOutlined /> Đang xem tại: <strong>{selectedFarm.name}</strong> ({selectedFarm.location})
                </Text>
            </div>

            {error ? (
                <Alert
                    message="Lỗi địa điểm"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <a href="/farms" style={{ marginLeft: 8 }}>Sửa vị trí nông trại</a>
                    }
                />
            ) : (
                <>
                    {/* --- THỜI TIẾT HIỆN TẠI --- */}
                    <Card
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            marginBottom: 24,
                            color: 'white'
                        }}
                    >
                        <Row align="middle" gutter={[24, 24]}>
                            <Col xs={24} md={12} style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                                <img
                                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                                    alt="weather icon"
                                    style={{ width: 120, height: 120 }}
                                />
                                <div style={{ fontSize: '4rem', fontWeight: 'bold', lineHeight: 1 }}>
                                    {Math.round(weather.main.temp)}°C
                                </div>
                                <div style={{ fontSize: '1.5rem', textTransform: 'capitalize', marginTop: 8 }}>
                                    {weather.weather[0].description}
                                </div>
                                <div style={{ marginTop: 8, opacity: 0.8 }}>
                                    Cảm giác như: {Math.round(weather.main.feels_like)}°C
                                </div>
                            </Col>
                            <Col xs={24} md={12}>
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <Card bordered={false} style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                            <Statistic
                                                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}><Droplet size={16} /> Độ ẩm</span>}
                                                value={weather.main.humidity} suffix="%"
                                                valueStyle={{ color: 'white' }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col span={12}>
                                        <Card bordered={false} style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                            <Statistic
                                                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}><Wind size={16} /> Gió</span>}
                                                value={weather.wind.speed} suffix="m/s"
                                                valueStyle={{ color: 'white' }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col span={12}>
                                        <Card bordered={false} style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                            <Statistic
                                                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}><Eye size={16} /> Tầm nhìn</span>}
                                                value={weather.visibility / 1000} suffix="km"
                                                valueStyle={{ color: 'white' }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col span={12}>
                                        <Card bordered={false} style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                            <Statistic
                                                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}><Thermometer size={16} /> Áp suất</span>}
                                                value={weather.main.pressure} suffix="hPa"
                                                valueStyle={{ color: 'white' }}
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Card>

                    <Divider orientation="left">Dự báo 5 ngày tới</Divider>

                    {/* --- DỰ BÁO --- */}
                    <Row gutter={[16, 16]}>
                        {forecast.map((item: any, index: number) => (
                            <Col xs={12} sm={8} md={4} key={index} style={{ flex: 1 }}>
                                <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
                                    <div style={{ fontWeight: 'bold', color: '#888' }}>
                                        {new Date(item.dt * 1000).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                    </div>
                                    <img
                                        src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                                        alt="icon"
                                    />
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1890ff' }}>
                                        {Math.round(item.main.temp)}°C
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'capitalize' }}>
                                        {item.weather[0].description}
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </>
            )}
        </div>
    );
};

export default WeatherPage;