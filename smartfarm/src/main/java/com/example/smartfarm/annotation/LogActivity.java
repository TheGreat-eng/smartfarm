package com.example.smartfarm.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD) // Chỉ dùng trên method
@Retention(RetentionPolicy.RUNTIME) // Tồn tại lúc chạy
public @interface LogActivity {
    String value();  // Mô tả hành động (ví dụ: "Tạo mới")
    String entity(); // Đối tượng (ví dụ: "NÔNG TRẠI")
}