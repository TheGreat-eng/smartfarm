import paho.mqtt.client as mqtt
import json
import time
import threading
import random
import sys
from datetime import datetime

# ================= CẤU HÌNH =================
BROKER = "localhost"
PORT = 1883

# ⚠️ LƯU Ý: Thay bằng đúng ID thiết bị bạn đang mở trên Web
TARGET_DEVICE_ID = "DHT-REALTIME-TEST" 

# Số lượng luồng spam (Tăng lên nếu muốn test tải nặng hơn)
NUM_THREADS = 5
# Tốc độ gửi tin mỗi luồng (giây)
DELAY = 0.2 

# Biến cờ để điều khiển dừng luồng
stop_event = threading.Event()

# ================= HÀM HỖ TRỢ =================

def get_timestamp():
    return datetime.now().isoformat()

def send_status(client, status):
    """Gửi trạng thái ONLINE/OFFLINE tới Backend"""
    topic = f"device/{TARGET_DEVICE_ID}/status"
    payload = {
        "deviceId": TARGET_DEVICE_ID,
        "status": status,
        "state": "ON" if status == "ONLINE" else "OFF", # Giả lập trạng thái máy
        "timestamp": get_timestamp()
    }
    client.publish(topic, json.dumps(payload), qos=1)
    print(f"📡 Đã gửi trạng thái: {status}")

def spam_sensor_data(thread_index):
    """Luồng gửi dữ liệu cảm biến liên tục"""
    # Tạo client riêng cho mỗi luồng để tăng áp lực kết nối
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"spammer-{thread_index}")
    try:
        client.connect(BROKER, PORT, 60)
        topic = f"sensor/{TARGET_DEVICE_ID}/data"
        
        while not stop_event.is_set():
            payload = {
                "deviceId": TARGET_DEVICE_ID,
                "sensorType": "DHT22",
                # Random giá trị dao động nhẹ để biểu đồ đẹp
                "temperature": round(random.uniform(25.0, 35.0), 1),
                "humidity": round(random.uniform(60.0, 80.0), 1),
                "soilMoisture": round(random.uniform(40.0, 60.0), 1),
                "lightIntensity": int(random.uniform(1000, 5000)),
                "soilPH": round(random.uniform(5.5, 7.5), 1),
                "timestamp": get_timestamp()
            }
            
            client.publish(topic, json.dumps(payload), qos=0)
            # print(f"Thread {thread_index}: Sent data...") # Comment lại cho đỡ lag terminal
            time.sleep(DELAY)
            
        client.disconnect()
    except Exception as e:
        print(f"Thread {thread_index} lỗi: {e}")

# ================= CHƯƠNG TRÌNH CHÍNH =================

def main():
    print(f"\n🚀 BẮT ĐẦU TEST THIẾT BỊ: {TARGET_DEVICE_ID}")
    print("------------------------------------------------")
    
    # 1. Kết nối Client quản lý trạng thái
    main_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="main-controller")
    try:
        main_client.connect(BROKER, PORT, 60)
        main_client.loop_start() # Chạy ngầm để xử lý network
    except Exception as e:
        print(f"❌ Không thể kết nối Broker: {e}")
        return

    # 2. Gửi lệnh ONLINE ngay khi bắt đầu
    send_status(main_client, "ONLINE")
    time.sleep(1) # Đợi xíu cho Web cập nhật

    # 3. Khởi động các luồng SPAM dữ liệu
    print(f"🔥 Đang spam dữ liệu với {NUM_THREADS} luồng...")
    threads = []
    for i in range(NUM_THREADS):
        t = threading.Thread(target=spam_sensor_data, args=(i,))
        t.start()
        threads.append(t)

    print("\n✅ Đang chạy... Hãy mở Dashboard để xem biểu đồ.")
    print("👉 Nhấn Ctrl + C để dừng và gửi lệnh OFFLINE.")

    # 4. Chờ tín hiệu dừng từ người dùng
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Đang dừng test...")
        
        # Dừng các luồng spam
        stop_event.set()
        for t in threads:
            t.join()
            
        # 5. QUAN TRỌNG: Gửi lệnh OFFLINE trước khi thoát
        print("zzz Đang gửi lệnh OFFLINE...")
        send_status(main_client, "OFFLINE")
        time.sleep(1) # Đợi message đi hết
        
        main_client.loop_stop()
        main_client.disconnect()
        print("👋 Kết thúc chương trình.")
        sys.exit(0)

if __name__ == "__main__":
    main()