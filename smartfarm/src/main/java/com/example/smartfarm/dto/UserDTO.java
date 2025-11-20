package com.example.smartfarm.dto;

import com.example.smartfarm.model.User;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;

    public UserDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.role = user.getRole();
    }
}