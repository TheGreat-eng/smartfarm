# Hướng dẫn chạy dự án SmartFarm bằng Docker Compose

Hệ thống SmartFarm này bao gồm 6 dịch vụ chính hoạt động cùng nhau:
1. **MySQL Database**: Lưu trữ dữ liệu cấu hình, tài khoản, trang trại, thiết bị,...
2. **Redis Cache**: Cải thiện hiệu suất truy vấn hệ thống bằng cách lưu bộ nhớ đệm (caching).
3. **InfluxDB**: Cơ sở dữ liệu chuỗi thời gian (Time Series DB) chuyên dụng để lưu trữ lượng lớn dữ liệu cảm biến.
4. **MQTT Broker (Mosquitto)**: Trình môi giới tin nhắn để truyền và nhận dữ liệu điều khiển/cảm biến từ thiết bị IoT.
5. **Spring Boot Backend**: Xử lý logic nghiệp vụ, APIs, phân quyền JWT và xử lý dữ liệu MQTT/WebSocket.
6. **Vite + React Frontend**: Giao diện người dùng trực quan hiển thị thông tin trang trại và các thiết bị.

---

## 📂 Danh sách các file cấu hình Docker đã tạo

* [docker-compose.yml](file:///D:/smartfarm/docker-compose.yml): Định nghĩa toàn bộ hạ tầng container và biến môi trường.
* [mosquitto/config/mosquitto.conf](file:///D:/smartfarm/mosquitto/config/mosquitto.conf): Cấu hình cho phép kết nối MQTT từ bên ngoài không cần mật khẩu phục vụ mô phỏng.

---

## 🛠️ Yêu cầu hệ thống

Trước khi bắt đầu, hãy chắc chắn bạn đã cài đặt các phần mềm sau trên máy tính:
1. **Docker Desktop** (hoặc Docker Engine trên Linux).
2. **Python 3.x** (để chạy các script mô phỏng thiết bị cảm biến).

---

## 🚀 Các bước khởi chạy dự án

### Bước 1: Khởi động các container Docker
Mở Terminal (Command Prompt hoặc PowerShell trên Windows) tại thư mục gốc của dự án (`D:\smartfarm`) và chạy lệnh sau để build và khởi chạy tất cả dịch vụ:

```bash
docker compose up -d --build
```

* `-d`: Chạy dưới nền (detached mode).
* `--build`: Build lại Docker image cho Backend và Frontend từ source code hiện tại.

### Bước 2: Kiểm tra trạng thái các dịch vụ
Bạn có thể xem danh sách các dịch vụ đang chạy bằng lệnh:

```bash
docker compose ps
```

Đảm bảo tất cả các container đều hiển thị trạng thái `running` (hoặc `healthy`).
* **Frontend**: Hoạt động tại địa chỉ: [http://localhost:3000](http://localhost:3000)
* **Backend API**: Hoạt động tại địa chỉ: [http://localhost:8080](http://localhost:8080)
* **Swagger UI (tài liệu API)**: Xem tại [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* **InfluxDB Dashboard**: Xem tại [http://localhost:8086](http://localhost:8086) (Tài khoản: `admin` / Mật khẩu: `my-super-secret-password`)
* **MQTT Broker Port**: `1883` (Chấp nhận kết nối không cần xác thực cho môi trường thử nghiệm)

---

## 🌾 Hướng dẫn chạy Giả lập Thiết bị (Python Simulators)

Vì các thiết bị cảm biến vật lý chưa được kết nối, bạn cần chạy các script Python đi kèm để giả lập dữ liệu gửi về MQTT Broker. Các script này sẽ chạy trên máy chủ (Host machine) kết nối vào cổng `1883` của Docker MQTT container.

### Bước 1: Cài đặt thư viện Python cần thiết
Mở một terminal mới trên máy của bạn và cài đặt thư viện hỗ trợ:

```bash
pip install paho-mqtt requests
```

### Bước 2: Đăng ký thiết bị ảo vào Backend
Mỗi thiết bị IoT cần có một địa chỉ MAC đã đăng ký để Backend chấp nhận dữ liệu.
Chạy script đăng ký thiết bị:

```bash
cd smartfarm
python device_registration_simulator.py
```

* Script sẽ tạo ra một địa chỉ MAC ngẫu nhiên và gửi yêu cầu đăng ký lên Backend tại địa chỉ [http://localhost:8080/api/devices/register](http://localhost:8080/api/devices/register).
* Ghi lại địa chỉ MAC được hiển thị trên màn hình.

### Bước 3: Nhận thiết bị trên giao diện Web
1. Truy cập trang web: [http://localhost:3000](http://localhost:3000)
2. Đăng ký tài khoản và đăng nhập (nếu hệ thống yêu cầu).
3. Đi tới mục **Quản lý thiết bị** (Device Management) để cấu hình và liên kết thiết bị có địa chỉ MAC vừa tạo vào trang trại của bạn.

### Bước 4: Chạy giả lập gửi dữ liệu cảm biến
Mở terminal và chạy simulator để gửi dữ liệu nhiệt độ, độ ẩm đất, ánh sáng, độ pH liên tục lên MQTT Broker:

```bash
python sensor_simulator1.py
```

* Thiết bị giả lập sẽ liên tục gửi gói tin định dạng JSON về các topic như `sensor/DHT22-123/data` hay `device/DHT22-123/status`.
* Backend sẽ tự động lắng nghe các topic này từ MQTT Broker, xử lý và lưu trữ dữ liệu vào MySQL & InfluxDB, đồng thời gửi dữ liệu realtime qua WebSocket lên giao diện Web cho bạn theo dõi.

---

## 🛑 Dừng hệ thống

Khi không sử dụng nữa, bạn có thể dừng và gỡ bỏ hoàn toàn các container bằng lệnh:

```bash
docker compose down
```

Nếu muốn xóa sạch toàn bộ dữ liệu đã lưu trong Database (để reset lại hệ thống từ đầu), chạy lệnh:

```bash
docker compose down -v
```
*(Lưu ý: Thao tác này sẽ xóa sạch dữ liệu trong các volume của MySQL, Redis, InfluxDB và MQTT)*
