package com.example.smartfarm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.smartfarm.service.CropHealthService;

@RestController
@RequestMapping("/api/farms/{farmId}/health")
public class CropHealthController {

    @Autowired
    private CropHealthService cropHealthService;

    @GetMapping
    public ResponseEntity<?> getHealthStatus(@PathVariable Long farmId) {
        try {
            return ResponseEntity.ok(cropHealthService.calculateHealth(farmId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }
}



