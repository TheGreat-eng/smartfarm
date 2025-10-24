package com.example.smartfarm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeviceRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String type; // e.g., "PUMP", "SENSOR_HUMIDITY"
    @NotBlank
    private String deviceIdentifier; // e.g., "pump-01", must be unique
}