package com.example.smartfarm.config;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.InfluxDBClientFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InfluxDBConfig {

    // Đọc các giá trị cấu hình từ file application.properties
    @Value("${influx.url}")
    private String url;

    @Value("${influx.token}")
    private String token;

    @Value("${influx.org}")
    private String org;

    @Value("${influx.bucket}")
    private String bucket;

    /**
     * Định nghĩa một Bean InfluxDBClient.
     * Spring sẽ gọi phương thức này để tạo một đối tượng InfluxDBClient duy nhất
     * và quản lý vòng đời của nó.
     *
     * @return một instance của InfluxDBClient đã được cấu hình.
     */
    @Bean
    public InfluxDBClient influxDBClient() {
        // Sử dụng factory để tạo client với các thông tin đã đọc từ properties
        InfluxDBClient client = InfluxDBClientFactory.create(url, token.toCharArray(), org, bucket);

        // Kiểm tra kết nối để đảm bảo cấu hình đúng
        // Nếu kết nối thất bại, ứng dụng sẽ không khởi động được -> phát hiện lỗi sớm
        try {
            client.ping();
            System.out.println("Successfully connected to InfluxDB at: " + url);
        } catch (Exception e) {
            System.err.println("Failed to connect to InfluxDB. Please check your configuration.");
            throw new RuntimeException("Could not connect to InfluxDB", e);
        }

        return client;
    }
}