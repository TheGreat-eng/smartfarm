package com.example.smartfarm.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.smartfarm.annotation.LogActivity;
import com.example.smartfarm.dto.DeviceRequest;
import com.example.smartfarm.dto.DeviceResponse;
import com.example.smartfarm.model.Device;
import com.example.smartfarm.security.services.UserDetailsImpl;
import com.example.smartfarm.service.DeviceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/farms/{farmId}/devices")
public class DeviceController {

    @Autowired
    private DeviceService deviceService;

    // TẠO THIẾT BỊ MỚI
    @PostMapping
    @LogActivity(value = "TẠO MỚI", entity = "THIẾT BỊ")
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
    @LogActivity(value = "ĐIỀU KHIỂN", entity = "THIẾT BỊ")
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
    @LogActivity(value = "LẤY DANH SÁCH", entity = "THIẾT BỊ")
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

    @PutMapping("{deviceId}")
    @LogActivity(value = "CẬP NHẬT", entity = "THIẾT BỊ")
    public ResponseEntity<DeviceResponse> updateDevice(
            @PathVariable Long farmId, @PathVariable Long deviceId,
            @Valid @RequestBody DeviceRequest deviceRequest, @AuthenticationPrincipal UserDetailsImpl userDetailsImpl) {
        Device updatedDevice = deviceService.updateDevice(deviceId, deviceRequest, userDetailsImpl.getId());

        return ResponseEntity.ok(new DeviceResponse(updatedDevice));
    }

    @DeleteMapping("{deviceId}")
    @LogActivity(value = "XÓA", entity = "THIẾT BỊ")
    public ResponseEntity<?> deleteDevice(@PathVariable Long farmId, @PathVariable Long deviceId,
            @AuthenticationPrincipal UserDetailsImpl userDetailsImpl) {

        deviceService.deleteDevice(deviceId, userDetailsImpl.getId());

        return ResponseEntity.ok().body("Delete Device Successfully");
    }

}