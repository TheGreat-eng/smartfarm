package com.example.smartfarm.model;

import com.influxdb.annotations.Column;
import com.influxdb.annotations.Measurement;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.time.Instant;

@Measurement(name = "sensor_data")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SensorData {
    @Column(tag = true)
    @NonNull
    private String sensorId;

    @Column(tag = true)
    @NonNull
    private String farmId;

    @Column(tag = true)
    @NonNull
    private String metricType;

    @Column
    private Double value;

    @Column(timestamp = true)
    private Instant time;
}