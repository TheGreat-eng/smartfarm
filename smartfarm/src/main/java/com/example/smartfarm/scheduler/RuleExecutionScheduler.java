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
import java.util.Optional;

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

    @Scheduled(fixedRate = 30000) // Run every 30 seconds
    @Transactional // Thêm annotation này
    public void executeRules() {
        log.info("Executing rules...");
        List<Rule> enabledRules = ruleRepository.findByEnabled(true);

        for (Rule rule : enabledRules) {
            Optional<SensorData> latestData = sensorDataRepository.findLatestBySensorIdAndMetric(
                    rule.getSensorDevice().getDeviceIdentifier(), rule.getConditionMetric());

            latestData.ifPresent(data -> {
                boolean conditionMet = evaluateCondition(data.getValue(), rule.getConditionOperator(),
                        rule.getConditionValue());
                if (conditionMet) {
                    log.info("Rule '{}' condition met for sensor '{}' with value {}. Triggering action.",
                            rule.getName(), data.getSensorId(), data.getValue());
                    triggerAction(rule);
                }
            });
        }
    }

    private boolean evaluateCondition(double currentValue, String operator, double ruleValue) {
        // ... (giữ nguyên)
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