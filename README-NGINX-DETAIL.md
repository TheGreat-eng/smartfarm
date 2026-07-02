# Hướng dẫn chi tiết chạy Frontend React với Nginx (Docker & Native)

Khi deploy môi trường thực tế (Production/Staging), mã nguồn React (TypeScript) sẽ được biên dịch (build) thành các tệp tin tĩnh (HTML, JS, CSS). Sau đó, **Nginx** sẽ làm nhiệm vụ phục vụ các tệp tin tĩnh này và làm Reverse Proxy để chuyển tiếp API và WebSocket về Backend.

Dưới đây là hướng dẫn chi tiết cả 2 cách chạy Frontend với Nginx:
1. **Cách 1: Chạy Nginx bằng Docker Container** (Khuyên dùng - Đã cấu hình sẵn trong docker-compose).
2. **Cách 2: Cài đặt và chạy Nginx trực tiếp trên máy chủ (Native Linux/Windows)**.

---

## 🛠️ Bước chuẩn bị chung: Build Frontend ra file tĩnh

Dù chạy Nginx theo cách nào, bạn đều cần build dự án React sang dạng tĩnh trước.
Mở Terminal tại thư mục `D:\smartfarm\smart-farm-frontend` và chạy:

```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Biên dịch mã nguồn thành file tĩnh
npm run build
```

Sau khi hoàn tất, một thư mục tên là `dist` sẽ xuất hiện trong thư mục `smart-farm-frontend/`. Đây là thư mục chứa toàn bộ sản phẩm đã đóng gói để đưa lên Nginx.

---

## 🐳 Cách 1: Chạy Nginx bằng Docker Container (Nhanh & Chuẩn nhất)

Cách này tận dụng Docker để chạy Nginx, không cần cài đặt thêm phần mềm Nginx lên hệ điều hành của bạn.

### 1. Phân tích cấu hình Docker Compose
Trong file `docker-compose-infra.yml` đã được cấu hình dịch vụ `frontend` như sau:

```yaml
  frontend:
    image: nginx:1.25-alpine
    container_name: smartfarm-frontend-nginx
    restart: always
    ports:
      - "3000:80" # Mở cổng 3000 trên máy thật trỏ vào cổng 80 trong container Nginx
    volumes:
      # Mount thư mục chứa file tĩnh vừa build ở máy thật vào thư mục Nginx phục vụ web tĩnh
      - ./smart-farm-frontend/dist:/usr/share/nginx/html:ro
      # Mount file config Nginx của dự án thay thế config mặc định của Nginx container
      - ./smart-farm-frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    extra_hosts:
      # Tạo DNS ảo để Nginx trỏ chữ "backend" về IP máy thật (Host machine)
      - "backend:host-gateway"
```

### 2. Các bước chạy:
1. Đảm bảo bạn đã chạy lệnh `npm run build` ở bước chuẩn bị.
2. Khởi động Docker Compose tại thư mục gốc `D:\smartfarm`:
   ```bash
   docker compose -f docker-compose-infra.yml up -d
   ```
3. Truy cập trình duyệt: [http://localhost:3000](http://localhost:3000).

---

## 💻 Cách 2: Cài đặt và chạy Nginx Native trực tiếp trên Hệ điều hành

Nếu bạn không muốn chạy Nginx trong Docker mà muốn cài trực tiếp trên Server (ví dụ Linux Ubuntu hoặc Windows):

### 🔹 Cách 2.1: Chạy trên Server Linux (Ubuntu/Debian)

#### 1. Cài đặt Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

#### 2. Copy thư mục code đã build vào thư mục của Web Server
Nén thư mục `dist` ở local rồi tải lên Server, hoặc build trực tiếp trên server, sau đó copy vào thư mục hệ thống:
```bash
sudo mkdir -p /var/www/smartfarm
sudo cp -r /path/to/smart-farm-frontend/dist/* /var/www/smartfarm/
# Cấp quyền cho Nginx đọc thư mục
sudo chown -R www-data:www-data /var/www/smartfarm
```

#### 3. Cấu hình Nginx
Tạo một file cấu hình ảo mới cho dự án:
```bash
sudo nano /etc/nginx/sites-available/smartfarm
```
Dán cấu hình sau vào (lưu ý: trỏ thẳng về `127.0.0.1:8080` vì Backend chạy chung máy thật với Nginx):
```nginx
server {
    listen 80;
    server_name your_domain_or_server_ip; # Thay thế bằng tên miền hoặc IP Server của bạn

    root /var/www/smartfarm;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests về Spring Boot chạy local port 8080
    location /api {
        proxy_pass http://127.0.0.1:8080/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy WebSocket Requests về Spring Boot
    location /ws {
        proxy_pass http://127.0.0.1:8080/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

#### 4. Kích hoạt cấu hình và khởi động lại Nginx
```bash
# Tạo liên kết kích hoạt cấu hình
sudo ln -s /etc/nginx/sites-available/smartfarm /etc/nginx/sites-enabled/
# Xóa cấu hình mặc định (nếu có) để tránh xung đột cổng 80
sudo rm /etc/nginx/sites-enabled/default
# Kiểm tra xem cấu hình có lỗi cú pháp không
sudo nginx -t
# Khởi động lại dịch vụ Nginx
sudo systemctl restart nginx
```

---

### 🔹 Cách 2.2: Chạy trên Windows Server / Windows Local

#### 1. Tải Nginx cho Windows
* Truy cập trang chủ Nginx để tải bản ổn định mới nhất: [https://nginx.org/en/download.html](https://nginx.org/en/download.html).
* Giải nén thư mục tải về (ví dụ giải nén vào ổ `C:\nginx`).

#### 2. Cấu hình Nginx trên Windows
Mở file `C:\nginx\conf\nginx.conf` bằng Notepad hoặc VS Code. Thay thế nội dung block `server { ... }` mặc định bằng nội dung cấu hình sau:

```nginx
server {
    listen       80;
    server_name  localhost;

    # Trỏ trực tiếp đến thư mục dist đã build ở dự án của bạn (Dùng dấu gạch chéo /)
    root         "D:/smartfarm/smart-farm-frontend/dist";
    index        index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests về Spring Boot Backend
    location /api {
        proxy_pass http://127.0.0.1:8080/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy WebSocket requests về Spring Boot Backend
    location /ws {
        proxy_pass http://127.0.0.1:8080/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

#### 3. Chạy Nginx trên Windows
Mở Command Prompt (cmd) với quyền Administrator tại thư mục `C:\nginx` và chạy:
```cmd
start nginx
```
* **Cách dừng Nginx trên Windows:**
  ```cmd
  nginx -s stop
  ```
* **Cách khởi động lại (áp dụng cấu hình mới):**
  ```cmd
  nginx -s reload
  ```

Bây giờ bạn truy cập [http://localhost](http://localhost) (cổng 80 mặc định) sẽ thấy giao diện React chạy mượt mà kết hợp cùng Backend của bạn!
