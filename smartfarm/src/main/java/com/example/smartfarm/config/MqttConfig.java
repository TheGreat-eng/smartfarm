package com.example.smartfarm.config;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

import com.example.smartfarm.service.MqttMessageHandler;

@Configuration
public class MqttConfig {

    @Value("${mqtt.broker.url}")
    private String brokerUrl;
    @Value("${mqtt.client.id}")
    private String clientId;
    @Value("${mqtt.topic.data}")
    private String dataTopic;

    @Autowired // // Inject bean xử lý tin nhắn MQTT
    private MqttMessageHandler mqttMessageHandler;

    // Đây là "Giấy thông hành & Cấu hình mạng" để kết nối tới MQTT broker
    @Bean
    public MqttPahoClientFactory mqttClientFactory() {
        // 
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory(); // Tạo factory mặc định
        MqttConnectOptions options = new MqttConnectOptions(); // Tạo tùy chọn kết nối mặc định
        options.setServerURIs(new String[] { brokerUrl }); // Đặt URL của MQTT broker(brokerUrl lấy từ file application.properties )

        // --- THAY ĐỔI QUAN TRỌNG NHẤT ---
        // Tắt cơ chế tự kết nối lại của Paho.
        // Hãy để Spring Integration tự quản lý việc kết nối lại,
        // vì nó nhận biết được vòng đời của ứng dụng.
        options.setAutomaticReconnect(false);

        options.setCleanSession(true); // // TRUE nghĩa là: Mỗi lần kết nối là một người mới tinh. Không nhớ những tin nhắn cũ chưa đọc.
        options.setConnectionTimeout(10); // // Thời gian chờ kết nối là 10 giây
        factory.setConnectionOptions(options); // Áp dụng các tùy chọn kết nối vào factory

        return factory;
    }

    

    // // Tạo kênh tin nhắn để nhận dữ liệu từ MQTT
    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }

    // // --- Inbound (Nhận dữ liệu cảm biến) ---

    //// Tạo adapter để nhận tin nhắn từ MQTT broker trên chủ đề dataTopic
    // giống như cái ăng ten để nhận dư liệu từ broker vậy.
    @Bean
    public MessageProducer inbound() {
        MqttPahoMessageDrivenChannelAdapter adapter = new MqttPahoMessageDrivenChannelAdapter(
                clientId + "_inbound", // Client ID cho kết nối inbound
                mqttClientFactory(), // Sử dụng factory đã định nghĩa ở trên
                dataTopic); // Chủ đề cần lắng nghe

        // Cấu hình adapter
        adapter.setCompletionTimeout(5000); // Thời gian chờ hoàn thành là 5000 ms
        adapter.setConverter(new DefaultPahoMessageConverter()); // // Chuyển đổi tin nhắn từ MQTT sang Spring Message
        adapter.setQos(1); // // Chất lượng dịch vụ (QoS) là 1: ít nhất một lần
        adapter.setOutputChannel(mqttInputChannel()); // // Đặt kênh đầu ra cho tin nhắn nhận được
        // Spring sẽ tự động start bean này, không cần setAutoStartup(true)
        return adapter;
    }

    // Xử lý tin nhắn nhận được từ kênh mqttInputChannel bằng MqttMessageHandler
    @Bean
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public MessageHandler mqttInboundHandler() {
        return mqttMessageHandler; // Trả về bean MqttMessageHandler đã inject
    }

    // --- Outbound (Gửi lệnh điều khiển) ---

    //  Tạo kênh tin nhắn để gửi dữ liệu ra MQTT
    // Đây là cái ống dẫn dữ liệu ra broker.
    @Bean
    public MessageChannel mqttOutboundChannel() {
        return new DirectChannel();
    }

    // // Xử lý tin nhắn gửi ra MQTT từ kênh mqttOutboundChannel
    @Bean
    @ServiceActivator(inputChannel = "mqttOutboundChannel")
    public MessageHandler mqttOutbound() {
        // tạo một bộ phát tin nhắn MQTT sử dụng Paho
        MqttPahoMessageHandler messageHandler = new MqttPahoMessageHandler(
                clientId + "_outbound", // Client ID cho kết nối outbound
                mqttClientFactory()); // Sử dụng factory đã định nghĩa ở trên
        messageHandler.setAsync(true);
        return messageHandler;
    }
}

