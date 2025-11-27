package com.example.smartfarm.service;

import com.example.smartfarm.dto.NotificationDTO;
import com.example.smartfarm.model.Notification;
import com.example.smartfarm.model.User;
import com.example.smartfarm.repository.NotificationRepository;
import com.example.smartfarm.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void sendNotificationToUser(Long userId, String message) {
        // 1. Lưu vào Database
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Notification notification = new Notification(message, "INFO", user);
        Notification savedNotif = notificationRepository.save(notification);

        // 2. Chuyển sang DTO
        NotificationDTO dto = new NotificationDTO(
                savedNotif.getId(),
                savedNotif.getMessage(),
                savedNotif.getTimestamp(),
                savedNotif.isRead(),
                savedNotif.getType()
        );

        // 3. Gửi qua WebSocket
        String destination = "/topic/notifications/" + userId;
        messagingTemplate.convertAndSend(destination, dto);
    }

    // Lấy danh sách thông báo cho API
    public List<NotificationDTO> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByTimestampDesc(userId).stream()
                .map(n -> new NotificationDTO(n.getId(), n.getMessage(), n.getTimestamp(), n.isRead(), n.getType()))
                .collect(Collectors.toList());
    }

    // Đánh dấu đã đọc
    public void markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId).orElse(null);
        if (n != null) {
            n.setRead(true);
            notificationRepository.save(n);
        }
    }

    // Đánh dấu tất cả là đã đọc
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> list = notificationRepository.findByUserIdOrderByTimestampDesc(userId);
        list.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(list);
    }
}