package com.example.smartfarm.service;

import com.example.smartfarm.dto.DeviceRequest;
import com.example.smartfarm.model.Device;
import com.example.smartfarm.model.Farm;
import com.example.smartfarm.repository.DeviceRepository;
import com.example.smartfarm.repository.FarmRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional; // 1. THÊM IMPORT NÀY

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DeviceService {

    @Autowired
    private DeviceRepository deviceRepository;
    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private MqttGateway mqttGateway; // Tiêm MqttGateway

    @Autowired
    private ObjectMapper objectMapper; // Dùng để chuyển Map thành JSON string

    @Transactional
    public Device createDevice(Long farmId, DeviceRequest deviceRequest, Long userId) {
        // Tìm nông trại
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found with id: " + farmId));

        // Kiểm tra quyền sở hữu
        if (!farm.getUser().getId().equals(userId)) {
            throw new SecurityException("User does not have permission to add a device to this farm");
        }

        // Kiểm tra deviceIdentifier đã tồn tại chưa
        if (deviceRepository.existsByDeviceIdentifier(deviceRequest.getDeviceIdentifier())) {
            throw new RuntimeException(
                    "Device identifier '" + deviceRequest.getDeviceIdentifier() + "' already exists.");
        }

        Device device = new Device();
        device.setName(deviceRequest.getName());
        device.setType(deviceRequest.getType());
        device.setDeviceIdentifier(deviceRequest.getDeviceIdentifier());
        device.setStatus("INACTIVE"); // Trạng thái mặc định
        device.setFarm(farm);

        return deviceRepository.save(device);
    }

    // Hàm mới để gửi lệnh
    @Transactional
    public void sendCommand(Long deviceId, String command, Long userId) {
        // 1. Lấy thông tin thiết bị từ DB
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found with id: " + deviceId));

        // 2. Kiểm tra quyền sở hữu (quan trọng)
        if (!device.getFarm().getUser().getId().equals(userId)) {
            throw new SecurityException("User does not have permission to control this device");
        }

        // 3. Xây dựng topic và payload
        String topic = "smartfarm/control/" + device.getDeviceIdentifier();
        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(Map.of("command", command.toUpperCase()));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error creating JSON payload", e);
        }

        // 4. Gửi lệnh qua MQTT Gateway
        mqttGateway.sendToMqtt(payloadJson, topic);
        System.out.println("Sent command '" + payloadJson + "' to topic '" + topic + "'");
    }

    public List<Device> getDevicesByFarm(Long farmId, Long userId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found with id: " + farmId));

        if (!farm.getUser().getId().equals(userId)) {
            throw new SecurityException("User does not have permission to view devices on this farm");
        }

        return deviceRepository.findAllByFarmId(farmId);
    }
}