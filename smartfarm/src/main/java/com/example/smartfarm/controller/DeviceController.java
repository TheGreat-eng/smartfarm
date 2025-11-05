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
import com.example.smartfarm.service.MqttGateway;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/farms/{farmId}/devices")
public class DeviceController {

    @Autowired
    private DeviceService deviceService;

    // TẠO THIẾT BỊ MỚI
    @PostMapping
    public ResponseEntity<?> createDevice(
            @PathVariable Long farmId,
            @Valid @RequestBody DeviceRequest deviceRequest,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Device newDevice = deviceService.createDevice(farmId, deviceRequest, userDetails.getId());
            return ResponseEntity.ok(new DeviceResponse(newDevice));
        } catch (DataIntegrityViolationException e) { // 2. THÊM KHỐI CATCH NÀY
            // Trả về 409 Conflict khi có lỗi ràng buộc duy nhất (unique constraint)
            return ResponseEntity.status(409)
                    .body("Device identifier '" + deviceRequest.getDeviceIdentifier() + "' already exists.");
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
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

    // LẤY DANH SÁCH THIẾT BỊ THEO NÔNG TRẠI
    @GetMapping
    public ResponseEntity<?> getDevicesByFarm(
            @PathVariable Long farmId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            List<DeviceResponse> devices = deviceService.getDevicesByFarm(farmId, userDetails.getId())
                    .stream()
                    .map(DeviceResponse::new)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(devices);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}