package com.example.smartfarm.service;

import com.example.smartfarm.dto.DeviceRequest;
import com.example.smartfarm.model.Device;
import com.example.smartfarm.model.Farm;
import com.example.smartfarm.repository.DeviceRepository;
import com.example.smartfarm.repository.FarmRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DeviceService {

    @Autowired
    private DeviceRepository deviceRepository;
    @Autowired
    private FarmRepository farmRepository;

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
}