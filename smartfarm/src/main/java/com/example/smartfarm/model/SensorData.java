package com.example.smartfarm.model;

import com.influxdb.annotations.Column;
import com.influxdb.annotations.Measurement;
import lombok.Data;

import java.time.Instant;

@Measurement(name = "sensor_data")
@Data
public class SensorData {
    @Column(tag = true)
    private String sensorId; // Corresponds to Device's deviceIdentifier

    @Column(tag = true)
    private String farmId;

    @Column(tag = true)
    private String metricType; // e.g., "temperature", "humidity"

    @Column
    private Double value;

    @Column(timestamp = true)
    private Instant time;
}