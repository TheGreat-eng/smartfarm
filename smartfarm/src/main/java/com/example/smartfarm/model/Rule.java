package com.example.smartfarm.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "rules")
@Data
public class Rule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // e.g., "humidity", "temperature"
    @Column(nullable = false)
    private String conditionMetric;

    // e.g., "<", ">", "="
    @Column(nullable = false)
    private String conditionOperator;

    @Column(nullable = false)
    private Double conditionValue;

    // e.g., "TURN_ON", "TURN_OFF"
    @Column(nullable = false)
    private String actionType;

    // Duration in minutes for the action, if applicable
    private Integer actionDuration;

    private boolean enabled = true;

    // The sensor that provides the data for the condition
    @ManyToOne
    @JoinColumn(name = "sensor_device_id")
    private Device sensorDevice;

    // The actuator device to be controlled
    @ManyToOne
    @JoinColumn(name = "actuator_device_id")
    private Device actuatorDevice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;
}