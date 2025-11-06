package com.example.smartfarm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // THÊM ANNOTATION NÀY
public class SmartfarmApplication {

	public static void main(String[] args) {

		SpringApplication.run(SmartfarmApplication.class, args);
	}

}
