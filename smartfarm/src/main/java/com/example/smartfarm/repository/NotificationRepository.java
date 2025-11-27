package com.example.smartfarm.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.smartfarm.model.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Lấy thông báo của user, sắp xếp mới nhất lên đầu
    List<Notification> findByUserIdOrderByTimestampDesc(Long userId);
    
    // Đếm số thông báo chưa đọc
    long countByUserIdAndIsReadFalse(Long userId);
}