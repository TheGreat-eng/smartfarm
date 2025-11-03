package com.example.smartfarm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SensorDataResponse {
    private String metricType; // "temperature", "humidity"
    private Double value;
    private Instant time;
}