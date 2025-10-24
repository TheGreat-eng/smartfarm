package com.example.smartfarm.service;

import org.springframework.integration.annotation.MessagingGateway;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

/**
 * Defines a gateway for sending MQTT messages.
 * This is the recommended way to send messages to an integration flow.
 */
@Component
@MessagingGateway(defaultRequestChannel = "mqttOutboundChannel")
public interface MqttGateway {

    /**
     * Sends a message to the specified MQTT topic.
     * 
     * @param data  The payload of the message.
     * @param topic The MQTT topic to publish to.
     */
    void sendToMqtt(String data, @Header(MqttHeaders.TOPIC) String topic);

}