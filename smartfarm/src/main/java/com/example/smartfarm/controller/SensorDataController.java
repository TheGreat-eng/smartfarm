package com.example.smartfarm.controller;

import com.example.smartfarm.dto.SensorDataResponse;
import com.example.smartfarm.security.services.UserDetailsImpl;
import com.example.smartfarm.service.SensorDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farms/{farmId}/sensordata")
public class SensorDataController {

    @Autowired
    private SensorDataService sensorDataService;

    // LẤY DỮ LIỆU CẢM BIẾN MỚI NHẤT
    @GetMapping("/latest")
    public ResponseEntity<?> getLatestSensorData(
            @PathVariable Long farmId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            List<SensorDataResponse> latestData = sensorDataService.getLatestSensorDataForFarm(farmId,
                    userDetails.getId());
            return ResponseEntity.ok(latestData);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // LẤY DỮ LIỆU LỊCH SỬ CẢM BIẾN
    @GetMapping("/history")
    public ResponseEntity<?> getSensorDataHistory(
            @PathVariable Long farmId,
            @RequestParam String metricType,
            @RequestParam String range,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            List<SensorDataResponse> historyData = sensorDataService.getSensorDataHistory(farmId,
                    userDetails.getId(), metricType, range);
            return ResponseEntity.ok(historyData);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}