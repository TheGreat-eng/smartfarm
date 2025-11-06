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
        // Bỏ DeviceRepository vì không cần nữa
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
                // Dòng này sẽ gọi phương thức mà chúng ta sắp dán vào file Repository
                return sensorDataRepository.findLatestDataForFarm(String.valueOf(farmId)).stream()
                                .map(data -> new SensorDataResponse(data.getMetricType(), data.getValue(),
                                                data.getTime()))
                                .collect(Collectors.toList());
        }

        // KHÔNG CÓ PHƯƠNG THỨC findLatestDataForFarm Ở ĐÂY NỮA
}