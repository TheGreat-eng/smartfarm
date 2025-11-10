package com.example.smartfarm.config;

import com.example.smartfarm.security.jwt.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.Customizer;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    /**
     * - Cấp phát AuthenticationManager từ AuthenticationConfiguration.
     * - Dùng cho quá trình authenticate (ví dụ trong AuthController khi login).
     * - Spring sẽ tự wire UserDetailsService và PasswordEncoder vào flow xác thực.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    // Định nghĩa PasswordEncoder sử dụng BCrypt.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Cấu hình chuỗi bộ lọc bảo mật.
     * - Cấu hình CORS, CSRF, quy tắc truy cập URL, quản lý session, và bộ lọc JWT.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter)
            throws Exception {
        http
                .cors(Customizer.withDefaults())

                // Tắt CSRF vì dùng JWT
                .csrf(AbstractHttpConfigurer::disable)

                // Cấu hình quy tắc cho các request HTTP
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/auth/**", "/ws/**").permitAll()
                        .requestMatchers("GET", "/api/farms/**").authenticated()
                        .requestMatchers("POST", "/api/farms/**").authenticated()
                        .requestMatchers("PUT", "/api/farms/**").authenticated()
                        .requestMatchers("DELETE", "/api/farms/**").authenticated()
                        .anyRequest().authenticated())

                // Cấu hình quản lý session
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Thêm bộ lọc JWT
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}