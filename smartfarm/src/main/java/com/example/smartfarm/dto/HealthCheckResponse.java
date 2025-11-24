package com.example.smartfarm.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HealthCheckResponse {
    private int score;           // Điểm số (0-100)
    private String status;       // "Tốt", "Cảnh báo", "Nguy hiểm"
    private List<String> issues; // Danh sách vấn đề (ví dụ: ["Nóng quá", "Đất khô"])
    private String cropName;     // Tên cây đang trồng
}