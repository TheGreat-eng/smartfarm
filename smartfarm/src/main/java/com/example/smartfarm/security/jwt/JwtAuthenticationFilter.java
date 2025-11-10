package com.example.smartfarm.security.jwt;

import com.example.smartfarm.security.services.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import org.springframework.util.AntPathMatcher;

@Component

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserDetailsServiceImpl userDetailsServiceImpl;

    private static Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    // Phương thức chính của filter: được Spring Security gọi cho mỗi request.
    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain filterChain) throws ServletException,
            IOException {
        try {
            String jwt = parsejwt(request);
            if (jwt != null && tokenProvider.validateToken(jwt)) {

                String username = tokenProvider.getUsernameFromJwt(jwt);
                UserDetails userDetails = userDetailsServiceImpl.loadUserByUsername(username);

                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authenticationToken);

            }

        } catch (Exception e) {
            logger.error("Cannot set user authentication", e.getMessage());
        }

        filterChain.doFilter(request, response);

    }

    // Trích xuất chuỗi JWT từ header "Authorization"
    private String parsejwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer")) {
            return headerAuth.substring(7);
        }

        return null;
    }

    // Bỏ qua không lọc các request đến endpoint của WebSocket
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        // Bỏ qua filter cho các endpoint auth và websocket
        return path.startsWith("/api/auth/") ||
                new AntPathMatcher().match("/ws/**", path);
    }

}
