package com.example.smartfarm.scheduler;

import com.example.smartfarm.model.Rule;
import com.example.smartfarm.model.SensorData;
import com.example.smartfarm.repository.RuleRepository;
import com.example.smartfarm.repository.SensorDataRepository;
import com.example.smartfarm.service.MqttGateway; // Thay đổi import
import com.example.smartfarm.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@Slf4j
public class RuleExecutionScheduler {

    @Autowired
    private RuleRepository ruleRepository;
    @Autowired
    private SensorDataRepository sensorDataRepository;

    // THAY ĐỔI: Sử dụng MqttGateway thay vì MessageHandler
    @Autowired
    private MqttGateway mqttGateway;

    @Autowired
    private NotificationService notificationService;

    // THỰC THI CÁC QUY TẮC
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void executeRules() {
        log.info("Executing rules...");
        List<Rule> enabledRules = ruleRepository.findByEnabled(true);

        if (enabledRules.isEmpty()) {
            return;
        }

        // Tối ưu: Nhóm các luật theo farmId
        Map<Long, List<Rule>> rulesByFarm = enabledRules.stream()
                .collect(Collectors.groupingBy(rule -> rule.getFarm().getId()));

        // Lặp qua mỗi farm
        rulesByFarm.forEach((farmId, rules) -> {
            // Lấy TẤT CẢ dữ liệu mới nhất của farm này trong 1 truy vấn
            List<SensorData> latestFarmData = sensorDataRepository.findLatestDataForFarm(String.valueOf(farmId));

            // Chuyển thành Map để truy cập nhanh
            Map<String, Double> dataMap = latestFarmData.stream()
                    .collect(Collectors.toMap(
                            data -> data.getSensorId() + ":" + data.getMetricType(),
                            SensorData::getValue,
                            (v1, v2) -> v1 // Trong trường hợp có key trùng lặp, giữ lại giá trị đầu tiên
            ));

            // Bây giờ xử lý các luật trong bộ nhớ, không cần query DB nữa
            for (Rule rule : rules) {
                String key = rule.getSensorDevice().getDeviceIdentifier() + ":" + rule.getConditionMetric();
                Double currentValue = dataMap.get(key);

                if (currentValue != null) {
                    boolean conditionMet = evaluateCondition(currentValue, rule.getConditionOperator(),
                            rule.getConditionValue());
                    if (conditionMet) {
                        log.info("Rule '{}' condition met for sensor '{}' with value {}. Triggering action.",
                                rule.getName(), key, currentValue);
                        triggerAction(rule);
                    }
                }
            }
        });
    }

    // ĐÁNH GIÁ ĐIỀU KIỆN CỦA QUY TẮC
    private boolean evaluateCondition(double currentValue, String operator, double ruleValue) {
        switch (operator) {
            case "<":
                return currentValue < ruleValue;
            case ">":
                return currentValue > ruleValue;
            case "<=":
                return currentValue <= ruleValue;
            case ">=":
                return currentValue >= ruleValue;
            case "=":
                return currentValue == ruleValue;
            default:
                return false;
        }
    }

    // KÍCH HOẠT HÀNH ĐỘNG CỦA QUY TẮC
    private void triggerAction(Rule rule) {
        String actuatorId = rule.getActuatorDevice().getDeviceIdentifier();
        String command = rule.getActionType(); // e.g., "TURN_ON"
        String topic = "smartfarm/control/" + actuatorId;
        String payload = String.format("{\"command\":\"%s\"}", command);

        // THAY ĐỔI: Gọi phương thức của gateway để gửi tin nhắn
        mqttGateway.sendToMqtt(payload, topic);

        // Send WebSocket notification
        Long userId = rule.getFarm().getUser().getId();
        String notificationMessage = String.format("Rule '%s' triggered: Device '%s' was commanded to '%s'.",
                rule.getName(), rule.getActuatorDevice().getName(), command);
        notificationService.sendNotificationToUser(userId, notificationMessage);
    }
}