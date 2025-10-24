package com.example.smartfarm.service;

import com.example.smartfarm.model.SensorData;
import com.example.smartfarm.repository.SensorDataRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@Slf4j
public class MqttMessageHandler {

    @Autowired
    private SensorDataRepository sensorDataRepository;
    @Autowired
    private ObjectMapper objectMapper;

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(String payload, @Header(MqttHeaders.RECEIVED_TOPIC) String topic) {
        log.info("Received MQTT message on topic [{}]: {}", topic, payload);
        try {
            // Topic format: smartfarm/data/{farmId}/{sensorId}/{metricType}
            String[] topicParts = topic.split("/");
            if (topicParts.length != 5) {
                log.warn("Invalid topic format: {}", topic);
                return;
            }
            String farmId = topicParts[2];
            String sensorId = topicParts[3];
            String metricType = topicParts[4];

            // Assuming payload is a simple value or a JSON like {"value": 25.5}
            double value;
            try {
                JsonNode rootNode = objectMapper.readTree(payload);
                value = rootNode.get("value").asDouble();
            } catch (Exception e) {
                value = Double.parseDouble(payload);
            }

            SensorData data = new SensorData();
            data.setFarmId(farmId);
            data.setSensorId(sensorId);
            data.setMetricType(metricType);
            data.setValue(value);
            data.setTime(Instant.now());

            sensorDataRepository.save(data);
            log.info("Saved sensor data: {}", data);

        } catch (Exception e) {
            log.error("Error processing MQTT message: {}", payload, e);
        }
    }
}