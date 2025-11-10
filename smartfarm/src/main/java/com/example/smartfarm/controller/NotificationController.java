package com.example.smartfarm.controller;

import com.example.smartfarm.dto.NotificationDTO;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;

import java.time.Instant;

@Controller
public class NotificationController {

    /**
     * Phương thức này xử lý các tin nhắn gửi đến destination '/app/hello'.
     * Nó chỉ là một ví dụ để kiểm tra kết nối hai chiều.
     * Client gửi tin nhắn đến '/app/hello', server nhận, xử lý và gửi lại
     * một tin nhắn chào mừng đến topic '/topic/greetings'.
     *
     * @param message Đối tượng chứa tin nhắn từ client (ví dụ: {"name": "toan"})
     * @return Một đối tượng NotificationDTO sẽ được gửi đến tất cả các client
     *         đang subscribe vào '/topic/greetings'.
     * @throws InterruptedException
     */
    @MessageMapping("/hello")
    @SendTo("/topic/greetings")
    public NotificationDTO greeting(HelloMessage message) throws InterruptedException {
        // Mô phỏng một chút độ trễ
        Thread.sleep(1000);
        String responseMessage = "Hello, " + HtmlUtils.htmlEscape(message.getName()) + "!";
        return new NotificationDTO(responseMessage, Instant.now());
    }

    /**
     * Một lớp nội tại (inner class) đơn giản để đại diện cho tin nhắn
     * được gửi từ client.
     */
    public static class HelloMessage {
        private String name;

        public HelloMessage() {
        }

        public HelloMessage(String name) {
            this.name = name;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
}