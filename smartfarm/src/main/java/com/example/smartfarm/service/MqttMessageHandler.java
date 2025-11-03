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

    // Lắng nghe tất cả các topic con bên trong smartfarm/data/
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(String payload, @Header(MqttHeaders.RECEIVED_TOPIC) String topic) {
        log.info("Received MQTT message on topic [{}]: {}", topic, payload);
        try {
            // Cấu trúc topic: smartfarm/data/{farmId}/{sensorId}/{metricType}
            String[] topicParts = topic.split("/");
            if (topicParts.length != 5 || !topicParts[0].equals("smartfarm") || !topicParts[1].equals("data")) {
                log.warn("Invalid topic format: {}", topic);
                return;
            }
            String farmId = topicParts[2];
            String sensorIdentifier = topicParts[3]; // Đổi tên để khớp với model
            String metricType = topicParts[4];

            // Xử lý payload JSON: {"value": 25.5}
            JsonNode rootNode = objectMapper.readTree(payload);
            if (!rootNode.has("value")) {
                log.warn("Payload does not contain 'value' field: {}", payload);
                return;
            }
            double value = rootNode.get("value").asDouble();

            SensorData data = new SensorData();
            data.setFarmId(farmId);
            data.setSensorId(sensorIdentifier); // Sử dụng deviceIdentifier của cảm biến
            data.setMetricType(metricType);
            data.setValue(value);
            data.setTime(Instant.now());

            sensorDataRepository.save(data);
            log.info("Successfully saved sensor data: {}", data);

        } catch (Exception e) {
            log.error("Error processing MQTT message: {}", payload, e);
        }
    }
}