package com.example.smartfarm.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // định nghĩa tiền tố cho các topics mà khách hàng đăng ký
        config.enableSimpleBroker("/topic");
        // định nghĩa tiền tố cho các message được gửi đến các phương thức
        // @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:3000") // Chỉ định rõ origin của frontend
                .setHandshakeHandler(new CustomHandshakeHandler())
                .withSockJS(); // Bật lại SockJS để tăng tính tương thích
    }
}