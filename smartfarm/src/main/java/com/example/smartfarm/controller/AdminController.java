// File: smartfarm/src/main/java/com/example/smartfarm/controller/AdminController.java
package com.example.smartfarm.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.smartfarm.dto.UserDTO;
import com.example.smartfarm.model.User;
import com.example.smartfarm.repository.ActivityLogRepository;
import com.example.smartfarm.repository.DeviceRepository;
import com.example.smartfarm.repository.FarmRepository;
import com.example.smartfarm.repository.UserRepository;

@RestController
@RequestMapping("/api/admin")
// Chỉ cho phép Role ADMIN truy cập toàn bộ controller này
@PreAuthorize("hasRole('ADMIN')") 
public class AdminController {


    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FarmRepository farmRepository;     // Thêm
    
    @Autowired
    private DeviceRepository deviceRepository; // Thêm

    // Lấy danh sách tất cả người dùng
    @GetMapping("/users")
public ResponseEntity<List<UserDTO>> getAllUsers() {
    // --- ĐOẠN CODE DEBUG ---
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    System.out.println("User hiện tại: " + auth.getName());
    System.out.println("Quyền hiện tại (Authorities): " + auth.getAuthorities());
    // -----------------------

    List<User> users = userRepository.findAll();
    
    // Chuyển đổi từ User Entity sang UserDTO
    List<UserDTO> userDTOs = users.stream()
            .map(UserDTO::new)
            .collect(Collectors.toList());
            
    return ResponseEntity.ok(userDTOs);
    }

    // Xóa người dùng
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }
    
    // 3. CẬP NHẬT: Thống kê chi tiết hơn
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long userCount = userRepository.count();
        long farmCount = farmRepository.count();     // Đếm số nông trại
        long deviceCount = deviceRepository.count(); // Đếm số thiết bị

        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", userCount);
        stats.put("totalFarms", farmCount);
        stats.put("totalDevices", deviceCount);

        return ResponseEntity.ok(stats);
    }









    @GetMapping("/logs")
    public ResponseEntity<?> getActivityLogs() {
        return ResponseEntity.ok(activityLogRepository.findAllByOrderByTimestampDesc());
    }
}