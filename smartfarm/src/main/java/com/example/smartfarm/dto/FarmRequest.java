package com.example.smartfarm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FarmRequest {
    @NotBlank
    private String name;
    private String location;
}