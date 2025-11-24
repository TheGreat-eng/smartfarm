package com.example.smartfarm.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.smartfarm.dto.HealthCheckResponse;
import com.example.smartfarm.model.CropProfile;
import com.example.smartfarm.model.Farm;
import com.example.smartfarm.model.SensorData;
import com.example.smartfarm.repository.FarmRepository;
import com.example.smartfarm.repository.SensorDataRepository;

@Service
public class CropHealthService {

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private SensorDataRepository sensorDataRepository;

    public HealthCheckResponse calculateHealth(Long farmId) {
        // 1. Tìm thông tin nông trại
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nông trại"));

        CropProfile profile = farm.getCropProfile();

        // 2. Nếu nông trại chưa chọn cây trồng -> Trả về mặc định
        if (profile == null) {
            return new HealthCheckResponse(100, "Chưa cấu hình", 
                    List.of("Vui lòng chọn loại cây trồng cho nông trại này."), "N/A");
        }

        // 3. Lấy dữ liệu cảm biến mới nhất từ InfluxDB
        // (Hàm findLatestDataForFarm đã có sẵn trong SensorDataRepository của bạn)
        List<SensorData> latestData = sensorDataRepository.findLatestDataForFarm(String.valueOf(farmId));

        int score = 100; // Điểm khởi đầu
        List<String> issues = new ArrayList<>();

        // 4. Bắt đầu chấm điểm
        for (SensorData data : latestData) {
            Double value = data.getValue();
            if (value == null) continue;

            String metric = data.getMetricType().toLowerCase(); // temperature, humidity...

            // Kiểm tra từng loại chỉ số
            if (metric.contains("temperature") || metric.contains("temp")) {
                if (value < profile.getMinTemp()) {
                    score -= 25;
                    issues.add("Nhiệt độ quá thấp (" + value + "°C < " + profile.getMinTemp() + "°C)");
                } else if (value > profile.getMaxTemp()) {
                    score -= 25;
                    issues.add("Nhiệt độ quá cao (" + value + "°C > " + profile.getMaxTemp() + "°C)");
                }
            } 
            else if (metric.contains("humidity")) {
                if (value < profile.getMinHumid()) {
                    score -= 25;
                    issues.add("Không khí quá khô (" + value + "% < " + profile.getMinHumid() + "%)");
                } else if (value > profile.getMaxHumid()) {
                    score -= 25;
                    issues.add("Độ ẩm không khí cao (" + value + "% > " + profile.getMaxHumid() + "%)");
                }
            }
            else if (metric.contains("soil") || metric.contains("moisture")) {
                if (value < profile.getMinSoilMoisture()) {
                    score -= 25;
                    issues.add("Đất đang bị khô (" + value + "% < " + profile.getMinSoilMoisture() + "%)");
                } else if (value > profile.getMaxSoilMoisture()) {
                    score -= 25;
                    issues.add("Đất bị ngập úng (" + value + "% > " + profile.getMaxSoilMoisture() + "%)");
                }
            }
            else if (metric.contains("light")) {
                if (value < profile.getMinLight()) {
                    score -= 25;
                    issues.add("Thiếu ánh sáng (" + value + " lux)");
                } else if (value > profile.getMaxLight()) {
                    score -= 25;
                    issues.add("Ánh sáng quá gắt (" + value + " lux)");
                }
            }
        }

        // 5. Tổng kết
        score = Math.max(0, score); // Không để điểm âm

        String status = "Tuyệt vời";
        if (score < 50) status = "Nguy hiểm";
        else if (score < 80) status = "Cảnh báo";

        if (issues.isEmpty()) {
            issues.add("Mọi chỉ số đều ổn định.");
        }

        return new HealthCheckResponse(score, status, issues, profile.getName());
    }
}