package com.example.smartfarm.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

public class CustomHandshakeHandler extends DefaultHandshakeHandler {

    /**
     * Ghi đè phương thức này để xác định người dùng cho kết nối WebSocket.
     * Trong ví dụ này, chúng ta không cần xác thực phức tạp ở bước handshake,
     * nên chúng ta có thể bỏ qua và trả về principal mặc định.
     */
    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        // Logic để xác định user có thể được thêm vào đây sau này nếu cần
        return super.determineUser(request, wsHandler, attributes);
    }

    /**
     * Ghi đè phương thức kiểm tra Origin.
     * Luôn trả về 'true' để chấp nhận kết nối từ bất kỳ nguồn nào.
     * **LƯU Ý:** Trong môi trường production, bạn nên có logic kiểm tra chặt chẽ
     * hơn
     * thay vì luôn trả về true.
     */
    @Override
    protected boolean isValidOrigin(ServerHttpRequest request) {
        return true;
    }
}