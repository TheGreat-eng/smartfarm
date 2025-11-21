package com.example.smartfarm.aspect;

import java.time.LocalDateTime;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.example.smartfarm.annotation.LogActivity;
import com.example.smartfarm.model.ActivityLog;
import com.example.smartfarm.repository.ActivityLogRepository;

import jakarta.servlet.http.HttpServletRequest;

@Aspect
@Component
public class ActivityLogger {

    @Autowired
    private ActivityLogRepository logRepository;

    // Chạy SAU KHI method có @LogActivity thực hiện thành công
    @AfterReturning(pointcut = "@annotation(logActivity)", returning = "result")
    public void logAction(JoinPoint joinPoint, LogActivity logActivity, Object result) {
        try {
            // 1. Lấy thông tin User hiện tại
            String username = "Anonymous";
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                username = SecurityContextHolder.getContext().getAuthentication().getName();
            }

            // 2. Lấy IP Address
            String ip = "Unknown";
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                ip = request.getRemoteAddr();
            }

            // 3. Tạo log
            ActivityLog log = new ActivityLog();
            log.setUsername(username);
            log.setAction(logActivity.value());
            log.setEntity(logActivity.entity());
            log.setIpAddress(ip);
            log.setTimestamp(LocalDateTime.now());

            // Tạo chi tiết đơn giản (Tên method + tham số đầu tiên nếu có)
            String methodName = joinPoint.getSignature().getName();
            Object[] args = joinPoint.getArgs();
            String details = "Method: " + methodName;
            if (args.length > 0 && args[0] != null) {
                details += " | Info: " + args[0].toString();
            }
            // Cắt ngắn nếu details quá dài để tránh lỗi DB
            if (details.length() > 255) details = details.substring(0, 255);
            log.setDetails(details);

            // 4. Lưu vào DB
            logRepository.save(log);
            System.out.println("✅ Activity Logged: " + username + " - " + logActivity.value());

        } catch (Exception e) {
            System.err.println("❌ Error saving activity log: " + e.getMessage());
        }
    }
}