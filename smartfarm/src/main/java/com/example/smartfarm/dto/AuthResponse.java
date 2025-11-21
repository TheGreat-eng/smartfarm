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

    public AuthResponse(String accessToken, String role) {
        this.accessToken = accessToken;
        this.role = role;
    }
}