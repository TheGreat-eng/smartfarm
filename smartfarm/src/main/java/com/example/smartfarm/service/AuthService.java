package com.example.smartfarm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.smartfarm.dto.AuthResponse;
import com.example.smartfarm.dto.LoginRequest;
import com.example.smartfarm.dto.RegisterRequest;
import com.example.smartfarm.model.User;
import com.example.smartfarm.repository.UserRepository;
import com.example.smartfarm.security.jwt.JwtTokenProvider;
import com.example.smartfarm.security.services.UserDetailsImpl;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;
    // Dùng để xác thực người dùng khi login

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    // ĐĂNG KÝ NGƯỜI DÙNG MỚI
    public User registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User(
                registerRequest.getUsername(),
                registerRequest.getEmail(),
                passwordEncoder.encode(registerRequest.getPassword()),
                registerRequest.getFullName());

        return userRepository.save(user);
    }

    // ĐĂNG NHẬP NGƯỜI DÙNG
    // Sửa kiểu trả về từ String -> AuthResponse
    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);

        // Lấy Role từ UserDetails
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
                .findFirst().map(item -> item.getAuthority()).orElse("ROLE_USER");

        // Trả về object chứa cả Token và Role
        return new AuthResponse(jwt, role);
    }
}