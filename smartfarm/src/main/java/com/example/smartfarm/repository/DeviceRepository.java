package com.example.smartfarm.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.smartfarm.model.Device;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    boolean existsByDeviceIdentifier(String deviceIdentifier);

    List<Device> findAllByFarmId(Long farmId);
}
