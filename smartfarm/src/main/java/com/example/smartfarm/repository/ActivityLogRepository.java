package com.example.smartfarm.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.smartfarm.model.ActivityLog;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    // Lấy danh sách mới nhất trước
    List<ActivityLog> findAllByOrderByTimestampDesc();
}