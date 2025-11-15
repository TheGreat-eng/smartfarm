// File: smartfarm/src/main/java/com/example/smartfarm/service/SensorDataService.java

package com.example.smartfarm.service;

import com.example.smartfarm.dto.SensorDataResponse;
import com.example.smartfarm.model.Farm;
import com.example.smartfarm.repository.FarmRepository;
import com.example.smartfarm.repository.SensorDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SensorDataService {

        @Autowired
        private SensorDataRepository sensorDataRepository;
        @Autowired
        private FarmRepository farmRepository;

        public List<SensorDataResponse> getLatestSensorDataForFarm(Long farmId, Long userId) {
                // 1. Kiểm tra quyền sở hữu
                Farm farm = farmRepository.findById(farmId)
                                .orElseThrow(() -> new RuntimeException("Farm not found with id: " + farmId));

                if (!farm.getUser().getId().equals(userId)) {
                        throw new SecurityException("User does not have permission to access this farm's data");
                }

                // 2. GỌI REPOSITORY để lấy dữ liệu.
                return sensorDataRepository.findLatestDataForFarm(String.valueOf(farmId)).stream()
                                .map(data -> new SensorDataResponse(data.getMetricType(), data.getValue(),
                                                data.getTime()))
                                .collect(Collectors.toList());
        }

        // ================== PHƯƠNG THỨC MỚI CHO DỮ LIỆU LỊCH SỬ ==================
        public List<SensorDataResponse> getSensorDataHistory(Long farmId, Long userId, String metricType,
                        String range) {
                // 1. Kiểm tra quyền sở hữu
                Farm farm = farmRepository.findById(farmId)
                                .orElseThrow(() -> new RuntimeException("Farm not found with id: " + farmId));

                if (!farm.getUser().getId().equals(userId)) {
                        throw new SecurityException("User does not have permission to access this farm's data");
                }

                // 2. Gọi repository để lấy dữ liệu lịch sử
                return sensorDataRepository.findDataForFarmByTimeRange(String.valueOf(farmId), metricType, range)
                                .stream()
                                .map(data -> new SensorDataResponse(data.getMetricType(), data.getValue(),
                                                data.getTime()))
                                .collect(Collectors.toList());
        }
        // ================== KẾT THÚC PHƯƠNG THỨC MỚI ==================
}