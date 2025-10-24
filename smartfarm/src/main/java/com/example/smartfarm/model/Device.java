package com.example.smartfarm.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "devices")
@Data
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // Type could be "PUMP", "FAN", "LIGHT", "SENSOR_TEMP", "SENSOR_HUMIDITY"
    @Column(nullable = false)
    private String type;

    // A unique identifier for MQTT topics, e.g., "pump-01"
    @Column(unique = true, nullable = false)
    private String deviceIdentifier;

    // Status could be "ON", "OFF", "ACTIVE", "INACTIVE"
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;
}