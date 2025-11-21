// File: smartfarm/src/main/java/com/example/smartfarm/security/services/UserDetailsImpl.java
package com.example.smartfarm.security.services;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.smartfarm.model.User;
import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;

@Getter
public class UserDetailsImpl implements UserDetails {
    private final Long id;
    private final String username;
    private final String email;
    @JsonIgnore
    private final String password;
    // THÊM: Lưu trữ quyền hạn
    private final Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Long id, String username, String email, String password, 
                           Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(User user) {
    // LỖI HAY GẶP: Nếu user.getRole() trả về null, nó sẽ chết hoặc lỗi quyền.
    // Hãy thêm log hoặc xử lý mặc định nếu null
    String userRole = user.getRole(); 
    if (userRole == null || userRole.isEmpty()) {
        userRole = "ROLE_USER"; // Mặc định nếu DB bị NULL
    }

    List<GrantedAuthority> authorities = Collections.singletonList(
            new SimpleGrantedAuthority(userRole) // <-- Quan trọng: Phải nạp role vào đây
    );

    return new UserDetailsImpl(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getPassword(),
            authorities); // <-- Và truyền vào constructor
}

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities; // Trả về danh sách quyền
    }

    // ... Các phương thức còn lại giữ nguyên (isAccountNonExpired, v.v.) ...
    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserDetailsImpl user = (UserDetailsImpl) o;
        return Objects.equals(id, user.id);
    }
}