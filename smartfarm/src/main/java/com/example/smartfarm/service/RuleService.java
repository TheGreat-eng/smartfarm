package com.example.smartfarm.service;

import com.example.smartfarm.dto.RuleRequest;
import com.example.smartfarm.model.Device;
import com.example.smartfarm.model.Farm;
import com.example.smartfarm.model.Rule;
import com.example.smartfarm.repository.DeviceRepository;
import com.example.smartfarm.repository.FarmRepository;
import com.example.smartfarm.repository.RuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RuleService {

    @Autowired
    private RuleRepository ruleRepository;
    @Autowired
    private FarmRepository farmRepository;
    @Autowired
    private DeviceRepository deviceRepository;

    @Transactional
    public Rule createRule(Long farmId, RuleRequest ruleRequest, Long userId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found with id: " + farmId));

        // 1. Kiểm tra quyền sở hữu nông trại
        if (!farm.getUser().getId().equals(userId)) {
            throw new SecurityException("User does not have permission for this farm");
        }

        // 2. Tìm thiết bị cảm biến và thiết bị điều khiển
        Device sensor = deviceRepository.findById(ruleRequest.getSensorDeviceId())
                .orElseThrow(() -> new RuntimeException("Sensor device not found"));
        Device actuator = deviceRepository.findById(ruleRequest.getActuatorDeviceId())
                .orElseThrow(() -> new RuntimeException("Actuator device not found"));

        // 3. (Quan trọng) Kiểm tra xem các thiết bị này có thuộc về đúng nông trại
        // không
        if (!sensor.getFarm().getId().equals(farmId) || !actuator.getFarm().getId().equals(farmId)) {
            throw new SecurityException("Devices do not belong to the specified farm");
        }

        Rule rule = new Rule();
        rule.setName(ruleRequest.getName());
        rule.setConditionMetric(ruleRequest.getConditionMetric());
        rule.setConditionOperator(ruleRequest.getConditionOperator());
        rule.setConditionValue(ruleRequest.getConditionValue());
        rule.setActionType(ruleRequest.getActionType());
        rule.setActionDuration(ruleRequest.getActionDuration());
        rule.setEnabled(true);
        rule.setSensorDevice(sensor);
        rule.setActuatorDevice(actuator);
        rule.setFarm(farm);

        return ruleRepository.save(rule);
    }
}