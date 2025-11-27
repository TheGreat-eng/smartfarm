import React, { useEffect, useState } from 'react';
import { Badge, Button, Popover, List, Typography, Empty, Avatar } from 'antd';
import { BellOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { notificationApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface NotificationItem {
    id: number;
    message: string;
    timestamp: string;
    read: boolean; // Lưu ý: backend trả về isRead hoặc read tùy JSON mapping
    type: string;
}

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const userId = localStorage.getItem('userId');

    // 1. Load thông báo từ DB khi trang web tải
    const fetchNotifications = async () => {
        try {
            const res = await notificationApi.getAll();
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: any) => !n.read).length);
        } catch (error) {
            console.error("Lỗi tải thông báo", error);
        }
    };

    useEffect(() => {
        if (!userId) return;
        fetchNotifications();

        // 2. Kết nối WebSocket để nhận thông báo mới realtime
        const token = localStorage.getItem('authToken');
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                client.subscribe(`/topic/notifications/${userId}`, (msg) => {
                    if (msg.body) {
                        const newNotif = JSON.parse(msg.body);
                        // Cập nhật list và tăng số lượng chưa đọc
                        setNotifications(prev => [newNotif, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    }
                });
            },
        });

        client.activate();
        return () => { if (client.active) client.deactivate(); };
    }, [userId]);

    // 3. Xử lý đánh dấu đã đọc
    const handleRead = async (item: NotificationItem) => {
        if (!item.read) {
            try {
                await notificationApi.markRead(item.id);
                // Cập nhật state local
                const newEvents = notifications.map(n =>
                    n.id === item.id ? { ...n, read: true } : n
                );
                setNotifications(newEvents);
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (e) { console.error(e); }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) { console.error(e); }
    };

    // Nội dung popup danh sách thông báo
    const content = (
        <div style={{ width: 350, maxHeight: 400, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px 8px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>Thông báo</Text>
                <Button type="link" size="small" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                    Đánh dấu tất cả đã đọc
                </Button>
            </div>
            <List
                dataSource={notifications}
                locale={{ emptyText: <Empty description="Không có thông báo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                renderItem={(item) => (
                    <List.Item
                        onClick={() => handleRead(item)}
                        style={{
                            cursor: 'pointer',
                            background: item.read ? '#fff' : '#e6f7ff', // Màu xanh nhạt nếu chưa đọc
                            padding: '12px',
                            transition: 'all 0.3s'
                        }}
                        className="notification-item"
                    >
                        <List.Item.Meta
                            avatar={<Avatar style={{ backgroundColor: item.read ? '#ccc' : '#1890ff' }} icon={<BellOutlined />} />}
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text delete={false} style={{ fontWeight: item.read ? 'normal' : 'bold', fontSize: 13 }}>
                                        {item.type === 'ALERT' ? 'Cảnh báo' : 'Hệ thống'}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </div>
                            }
                            description={<Text style={{ color: item.read ? '#888' : '#333' }}>{item.message}</Text>}
                        />
                        {!item.read && <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />}
                    </List.Item>
                )}
            />
        </div>
    );

    return (
        <Popover
            content={content}
            title={null}
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="bottomRight"
        >
            <Badge count={unreadCount} overflowCount={99}>
                <Button
                    type="text"
                    icon={<BellOutlined style={{ fontSize: '20px' }} />}
                    style={{ height: 'auto', padding: 8 }}
                />
            </Badge>
        </Popover>
    );
};

export default NotificationBell;