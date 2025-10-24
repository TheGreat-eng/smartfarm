package com.example.smartfarm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RuleRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String conditionMetric;

    @NotBlank
    private String conditionOperator;

    @NotNull
    private Double conditionValue;

    @NotBlank
    private String actionType;

    private Integer actionDuration; // Optional

    @NotNull
    private Long sensorDeviceId;

    @NotNull
    private Long actuatorDeviceId;
}