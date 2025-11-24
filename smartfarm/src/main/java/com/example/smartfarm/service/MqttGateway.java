package com.example.smartfarm.service;

import org.springframework.integration.annotation.MessagingGateway;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;


@Component
@MessagingGateway(defaultRequestChannel = "mqttOutboundChannel")
//Ý nghĩa là "Bất cứ cái gì được đưa vào hàm này, hãy ném nó vào đường ống có tên mqttOutboundChannel".
public interface MqttGateway {
//  MqttGateway  Cái nút bấm để gửi tin nhắn MQTT



    void sendToMqtt(String data, @Header(MqttHeaders.TOPIC) String topic);
    // @Header(MqttHeaders.TOPIC): Tham số thứ 2 của hàm sẽ được biến thành "Tiêu đề Topic" của gói tin MQTT.

}