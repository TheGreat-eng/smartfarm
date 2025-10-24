package com.example.smartfarm.dto;

import com.example.smartfarm.model.Rule;
import lombok.Data;

@Data
public class RuleResponse {
    private Long id;
    private String name;
    private String conditionMetric;
    private String conditionOperator;
    private Double conditionValue;
    private String actionType;
    private Integer actionDuration;
    private boolean enabled;
    private Long sensorDeviceId;
    private Long actuatorDeviceId;
    private Long farmId;

    public RuleResponse(Rule rule) {
        this.id = rule.getId();
        this.name = rule.getName();
        this.conditionMetric = rule.getConditionMetric();
        this.conditionOperator = rule.getConditionOperator();
        this.conditionValue = rule.getConditionValue();
        this.actionType = rule.getActionType();
        this.actionDuration = rule.getActionDuration();
        this.enabled = rule.isEnabled();
        this.sensorDeviceId = rule.getSensorDevice().getId();
        this.actuatorDeviceId = rule.getActuatorDevice().getId();
        this.farmId = rule.getFarm().getId();
    }
}