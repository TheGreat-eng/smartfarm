package com.example.smartfarm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.smartfarm.annotation.LogActivity;
import com.example.smartfarm.dto.AuthResponse;
import com.example.smartfarm.dto.LoginRequest;
import com.example.smartfarm.dto.RegisterRequest;
import com.example.smartfarm.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    // ĐĂNG NHẬP
    @PostMapping("/login")
    @LogActivity(value = "ĐĂNG NHẬP", entity = "NGƯỜI DÙNG")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        logger.info("Login attempt for user: {}", loginRequest.getUsername());
        try {
            // Gọi service đã sửa đổi
            AuthResponse response = authService.authenticateUser(loginRequest);
            
            logger.info("Login successful for user: {}", loginRequest.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Login failed", e);
            return ResponseEntity.status(403).body("Invalid username or password");
        }
    }

    // ĐĂNG KÝ
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            authService.registerUser(registerRequest);
            return ResponseEntity.ok("user registered successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
