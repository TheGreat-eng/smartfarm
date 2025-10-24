package com.example.smartfarm.service;

import com.example.smartfarm.dto.NotificationDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendNotificationToUser(Long userId, String message) {
        String destination = "/topic/notifications/" + userId;
        NotificationDTO notification = new NotificationDTO(message, Instant.now());
        messagingTemplate.convertAndSend(destination, notification);
    }
}