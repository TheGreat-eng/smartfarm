package com.example.smartfarm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Data Transfer Object for sending notifications via WebSocket.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {

    /**
     * The content of the notification message.
     */
    private String message;

    /**
     * The timestamp when the notification was generated.
     */
    private Instant timestamp;
}