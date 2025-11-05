package com.example.smartfarm.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

public class CustomHandshakeHandler extends DefaultHandshakeHandler {

    /**
     * Ghi đè phương thức này để xác định người dùng cho kết nối WebSocket.
     */
    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        // Logic để xác định user có thể được thêm vào đây sau này nếu cần
        return super.determineUser(request, wsHandler, attributes);
    }

    /**
     * Ghi đè phương thức kiểm tra Origin.
     */
    @Override
    protected boolean isValidOrigin(ServerHttpRequest request) {
        return true;
    }
}