package com.example.smartfarm.dto;

import com.example.smartfarm.model.Device;
import lombok.Data;

@Data
public class DeviceResponse {
    private Long id;
    private String name;
    private String type;
    private String deviceIdentifier;
    private String status;
    private Long farmId;

    public DeviceResponse(Device device) {
        this.id = device.getId();
        this.name = device.getName();
        this.type = device.getType();
        this.deviceIdentifier = device.getDeviceIdentifier();
        this.status = device.getStatus();
        this.farmId = device.getFarm().getId();
    }
}