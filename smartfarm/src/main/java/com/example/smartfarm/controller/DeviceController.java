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
import com.example.smartfarm.service.MqttGateway; // 1. Import MqttGateway
import java.util.Map; // 2. Import Map

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

    // 4. TẠO API MỚI ĐỂ ĐIỀU KHIỂN THIẾT BỊ
    @PostMapping("/{deviceId}/control")
    public ResponseEntity<?> controlDevice(
            @PathVariable Long deviceId,
            @RequestBody Map<String, String> payload, // Nhận JSON đơn giản {"command": "TURN_ON"}
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            String command = payload.get("command");
            if (command == null || (!command.equalsIgnoreCase("TURN_ON") && !command.equalsIgnoreCase("TURN_OFF"))) {
                return ResponseEntity.badRequest().body("Invalid command. Must be TURN_ON or TURN_OFF.");
            }

            // Gọi service để gửi lệnh
            deviceService.sendCommand(deviceId, command, userDetails.getId());

            return ResponseEntity.ok().body("Command sent successfully.");
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}