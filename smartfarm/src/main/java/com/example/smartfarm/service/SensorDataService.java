package com.example.smartfarm.service;

import com.example.smartfarm.dto.SensorDataResponse;
import com.example.smartfarm.model.Device;
import com.example.smartfarm.model.Farm;
import com.example.smartfarm.repository.DeviceRepository;
import com.example.smartfarm.repository.FarmRepository;
import com.example.smartfarm.repository.SensorDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class SensorDataService {

        @Autowired
        private SensorDataRepository sensorDataRepository;
        @Autowired
        private DeviceRepository deviceRepository;
        @Autowired
        private FarmRepository farmRepository;

        public List<SensorDataResponse> getLatestSensorDataForFarm(Long farmId, Long userId) {
                // 1. Kiểm tra xem farm có tồn tại và thuộc sở hữu của user không
                Farm farm = farmRepository.findById(farmId)
                                .orElseThrow(() -> new RuntimeException("Farm not found with id: " + farmId));

                if (!farm.getUser().getId().equals(userId)) {
                        throw new SecurityException("User does not have permission to access this farm's data");
                }

                // 2. Lấy tất cả các thiết bị CẢM BIẾN của nông trại này
                List<Device> sensors = deviceRepository.findAllByFarmId(farmId).stream()
                                .filter(device -> device.getType().toUpperCase().contains("SENSOR"))
                                .collect(Collectors.toList());

                return sensors.stream()
                                .flatMap((Device sensor) -> {
                                        // Nếu là DHT22, ta cần tìm cả nhiệt độ và độ ẩm
                                        if ("SENSOR_DHT22".equalsIgnoreCase(sensor.getType())) {
                                                Stream<SensorDataResponse> tempData = sensorDataRepository
                                                                .findLatestBySensorIdAndMetric(
                                                                                sensor.getDeviceIdentifier(),
                                                                                "temperature")
                                                                .map(data -> new SensorDataResponse(
                                                                                data.getMetricType(), data.getValue(),
                                                                                data.getTime()))
                                                                .stream();
                                                Stream<SensorDataResponse> humData = sensorDataRepository
                                                                .findLatestBySensorIdAndMetric(
                                                                                sensor.getDeviceIdentifier(),
                                                                                "humidity")
                                                                .map(data -> new SensorDataResponse(
                                                                                data.getMetricType(), data.getValue(),
                                                                                data.getTime()))
                                                                .stream();
                                                return Stream.concat(tempData, humData);
                                        } else {
                                                // Logic cũ cho các cảm biến khác
                                                String metricType = sensor.getType().replace("SENSOR_", "")
                                                                .toLowerCase();
                                                return sensorDataRepository
                                                                .findLatestBySensorIdAndMetric(
                                                                                sensor.getDeviceIdentifier(),
                                                                                metricType)
                                                                .map(data -> new SensorDataResponse(
                                                                                data.getMetricType(), data.getValue(),
                                                                                data.getTime()))
                                                                .stream();
                                        }
                                })
                                .collect(Collectors.toList());
        }
}