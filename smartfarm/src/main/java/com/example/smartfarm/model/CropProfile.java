package com.example.smartfarm.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "crop_profiles")
@Data
public class CropProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // Tên cây: Cà chua, Dâu tây...

    // 1. Nhiệt độ (°C)
    private Double minTemp;
    private Double maxTemp;

    // 2. Độ ẩm không khí (%)
    private Double minHumid;
    private Double maxHumid;

    // 3. Độ ẩm đất (%)
    private Double minSoilMoisture;
    private Double maxSoilMoisture;

    // 4. Ánh sáng (Lux)
    private Double minLight;
    private Double maxLight;
}