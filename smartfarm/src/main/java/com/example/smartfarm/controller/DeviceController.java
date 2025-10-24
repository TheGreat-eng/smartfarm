package com.example.smartfarm.controller;

import com.example.smartfarm.dto.DeviceRequest;
import com.example.smartfarm.dto.DeviceResponse;
import com.example.smartfarm.model.Device;
import com.example.smartfarm.security.services.UserDetailsImpl;
import com.example.smartfarm.service.DeviceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/farms/{farmId}/devices")
public class DeviceController {

    @Autowired
    private DeviceService deviceService;

    @PostMapping
    public ResponseEntity<?> createDevice(
            @PathVariable Long farmId,
            @Valid @RequestBody DeviceRequest deviceRequest,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Device newDevice = deviceService.createDevice(farmId, deviceRequest, userDetails.getId());
            return ResponseEntity.ok(new DeviceResponse(newDevice));
        } catch (SecurityException e) {
            // Trả về 403 khi người dùng không có quyền
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            // Trả về 400 cho các lỗi khác (farm not found, identifier exists)
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}