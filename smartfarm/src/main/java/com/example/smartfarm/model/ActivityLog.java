package com.example.smartfarm.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "activity_logs")
@Data
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;    // Ai làm?
    private String action;      // Hành động gì? (CREATE, DELETE...)
    private String entity;      // Đối tượng nào? (FARM, DEVICE...)
    private String details;     // Chi tiết (Ví dụ: Xóa farm ID 5)
    private String ipAddress;   // IP người dùng

    private LocalDateTime timestamp = LocalDateTime.now();
}