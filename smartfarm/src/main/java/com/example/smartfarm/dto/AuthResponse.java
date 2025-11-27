// File: smartfarm/src/main/java/com/example/smartfarm/dto/AuthResponse.java
package com.example.smartfarm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private String role; // THÊM: Trả về role cho client
    private Long id; // <--- THÊM DÒNG NÀY

    // Cập nhật constructor
    public AuthResponse(String accessToken, String role, Long id) {
        this.accessToken = accessToken;
        this.role = role;
        this.id = id;
    }
}