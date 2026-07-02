# Hướng dẫn chạy Lai (Hybrid) chuẩn doanh nghiệp - SmartFarm

Mô hình triển khai chuẩn nghiệp nghiệp lớn (Staging/Production-like):
* **Hạ tầng (MySQL, Redis, InfluxDB, MQTT Mosquitto) & Nginx Web Server**: Chạy trên Docker.
* **Backend (Spring Boot)**: Chạy Native (trực tiếp trên máy chủ / máy local cổng `8080`).
* **Frontend (React)**: Được **Build** ra thư mục chứa file tĩnh (`dist`) ở máy host, sau đó container **Nginx** sẽ mount thư mục này và phục vụ ở cổng `3000`. Toàn bộ API/WebSocket sẽ được Nginx điều hướng (reverse proxy) ngược lại Backend đang chạy native trên máy host thông qua địa chỉ `host-gateway`.

---

## 📂 Danh sách các file liên quan
* [docker-compose-infra.yml](file:///D:/smartfarm/docker-compose-infra.yml): Định nghĩa các container hạ tầng và Nginx frontend.
* [smart-farm-frontend/nginx.conf](file:///D:/smartfarm/smart-farm-frontend/nginx.conf): Cấu hình reverse proxy của Nginx.

---

## 🛠️ Yêu cầu cài đặt trên máy chủ (Host)
1. **Docker Desktop** (hoặc Docker Engine).
2. **Java JDK 17** & **Maven** (hoặc sử dụng file `mvnw` đi kèm).
3. **Node.js (v18/v20+)** & `npm` (để cài đặt dependencies và build frontend).
4. **Python 3.x** (chạy script mô phỏng thiết bị).

---

## 🚀 Các bước khởi chạy chi tiết

### Bước 1: Build mã nguồn tĩnh của Frontend (React)
Để chạy theo cách chuyên nghiệp nhất, bạn cần biên dịch mã nguồn React sang HTML/JS/CSS tĩnh trước khi đưa vào Nginx:

Mở terminal tại thư mục `D:\smartfarm\smart-farm-frontend`:
1. Cài đặt các packages (chỉ cần chạy lần đầu):
   ```bash
   npm install
   ```
2. Thực hiện biên dịch (Build):
   ```bash
   npm run build
   ```
   *Lệnh này sẽ tạo ra thư mục `smart-farm-frontend/dist` chứa các file tĩnh được tối ưu hóa cao.*

---

### Bước 2: Khởi động Hạ tầng Docker (bao gồm Nginx phục vụ Frontend)
Quay lại thư mục gốc `D:\smartfarm` và chạy:

```bash
docker compose -f docker-compose-infra.yml up -d
```

Lúc này Docker sẽ:
1. Tạo MySQL, Redis, InfluxDB, MQTT Mosquitto.
2. Khởi chạy một container **Nginx** (được cấu hình để mount thư mục `smart-farm-frontend/dist` của bạn làm thư mục phân phối web tĩnh).

---

### Bước 3: Khởi chạy Spring Boot Backend (Native)
Mở một terminal mới tại thư mục `D:\smartfarm\smartfarm`:

1. **Build backend:**
   * Trên Windows:
     ```cmd
     mvnw.cmd clean package -DskipTests
     ```
   * Trên Linux/macOS:
     ```bash
     chmod +x ./mvnw
     ./mvnw clean package -DskipTests
     ```
2. **Chạy ứng dụng:**
   ```bash
   java -jar target/iotserver-0.0.1-SNAPSHOT.jar
   ```

Backend sẽ khởi chạy ở cổng `8080`.

---

### Bước 4: Kiểm thử ứng dụng
1. Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)
   * Nginx đang chạy trong Docker sẽ hiển thị giao diện React của bạn.
   * Khi bạn đăng nhập hoặc tải trang, Nginx sẽ nhận request tại `/api` và chuyển tiếp đến `host-gateway:8080` (tức là Backend chạy native của bạn).
2. Chạy Python simulators cảm biến trên host để đẩy dữ liệu lên cổng MQTT `1883`:
   ```bash
   pip install paho-mqtt requests
   python smartfarm/device_registration_simulator.py
   python smartfarm/sensor_simulator1.py
   ```

---

## 🛑 Cách dừng hoặc cập nhật giao diện
* Khi bạn thay đổi code Frontend (React), chỉ cần chạy lệnh `npm run build` ở máy host. Thư mục `dist` được cập nhật và Nginx trong Docker sẽ nhận giao diện mới ngay lập tức mà không cần khởi động lại container.
* Để dừng toàn bộ các container:
  ```bash
  docker compose -f docker-compose-infra.yml down
  ```
