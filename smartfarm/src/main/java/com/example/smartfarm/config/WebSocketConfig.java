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
        // Defines prefixes for topics that clients subscribe to
        config.enableSimpleBroker("/topic");
        // Defines the prefix for messages bound for @MessageMapping-annotated methods
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                // Thêm dòng này để sử dụng HandshakeHandler tùy chỉnh
                .setHandshakeHandler(new CustomHandshakeHandler());
        // Bạn có thể tạm thời bỏ SockJS nếu vẫn đang debug
        // .withSockJS();
    }
}