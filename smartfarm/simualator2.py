# File: simulator/sensor_simulator1.py
# (Upgraded for paho-mqtt v2.x with fixes and improvements)

import json
import time
import random
import math
from datetime import datetime
from typing import Dict, Any
import paho.mqtt.client as mqtt
import os

FARM_ID = 1

class SensorSimulator:
    def __init__(self, broker_host="localhost", broker_port=1883, username=None, password=None):
        # ✅ SỬA 1: Khởi tạo client với API phiên bản 2
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        
        if username:
            self.client.username_pw_set(username=username, password=password)
            
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.connected = False

        # Trạng thái mô phỏng
        self.base_temperature = 28.0
        self.base_humidity = 65.0
        self.soil_moisture = 50.0
        self.light_intensity = 10000.0
        self.ph_level = 6.5

        self.start_time = time.time()

        # ✅ SỬA 2: Gán các hàm callback
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect

    # ================= MQTT Callbacks (Cú pháp mới) =================
    
    # ✅ SỬA 3: Cập nhật chữ ký (tham số) của hàm on_connect
    def on_connect(self, client, userdata, flags, reason_code, properties):
        if reason_code == 0:
            print("✅ Connected to MQTT Broker!")
            self.connected = True
        else:
            print(f"❌ Failed to connect, reason code {reason_code}")
            self.connected = False

    # ✅ SỬA 4: Cập nhật chữ ký của hàm on_disconnect
    def on_disconnect(self, client, userdata, flags, reason_code, properties):
        print(f"⚠️  Disconnected from MQTT Broker with reason code: {reason_code}")
        self.connected = False

    # =============== Logic Kết nối & Chạy =================
    
    def connect(self):
        try:
            print(f"🔗 Connecting to {self.broker_host}:{self.broker_port}...")
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start() # Bắt đầu vòng lặp network ngay sau khi gọi connect
            return True
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False

    def run_simulation(self, devices: list, interval: int = 10):
        print("\n" + "="*64)
        print("🌾 Smart Farm IoT Simulator (UI-matched device IDs)")
        print("="*64)
        print(f"Devices: {len(devices)} | Interval: {interval}s | Broker: {self.broker_host}:{self.broker_port}\n")

        if not self.connect():
            return

        # Đợi kết nối thành công (tối đa 10s)
        connect_timeout = time.time() + 10
        while not self.connected and time.time() < connect_timeout:
            time.sleep(0.5)
        
        if not self.connected:
            print("❌ Connection timed out. Exiting.")
            self.client.loop_stop()
            return

        # Gửi trạng thái ONLINE ban đầu
        for d in devices:
            self.publish_device_status(d["id"], "ONLINE")

        try:
            it = 0
            while True:
                it += 1
                hour = self.get_time_factor()
                print(f"\n--- Iteration {it} | Simulated {int(hour):02d}:00 ---")

                if not self.connected:
                    print("Connection lost, will try to reconnect automatically...")
                    # Thư viện sẽ tự động kết nối lại, chỉ cần chờ
                    time.sleep(5)
                    continue

                for d in devices:
                    t = d["type"]
                    data = None
                    if t == "DHT22":
                        data = self.simulate_dht22(d["id"])
                    elif t == "SOIL_MOISTURE":
                        data = self.simulate_soil_moisture(d["id"])
                    elif t == "LIGHT":
                        data = self.simulate_light_sensor(d["id"])
                    elif t == "PH":
                        data = self.simulate_ph_sensor(d["id"])
                    
                    if data:
                        self.publish_sensor_data(d["id"], data)

                print(f"💤 Sleep {interval}s…")
                time.sleep(interval)

        except KeyboardInterrupt:
            print("\n🛑 Stopping simulator…")
            for d in devices:
                self.publish_device_status(d["id"], "OFFLINE")
                time.sleep(0.1) # Đợi một chút để gửi hết message
            self.client.loop_stop()
            self.client.disconnect()
            print("✅ Stopped.")

    # =============== Các hàm mô phỏng (Giữ nguyên, đã thống nhất camelCase) ===============
    
    def get_time_factor(self) -> float:
        elapsed = time.time() - self.start_time
        hour_of_day = (elapsed / 60) % 24
        return hour_of_day

    def simulate_dht22(self, device_id: str) -> Dict[str, Any]:
        hour = self.get_time_factor()
        temp_variation = 5 * math.sin((hour - 6) * math.pi / 12)
        temperature = self.base_temperature + temp_variation + random.uniform(-1, 1)
        humidity = self.base_humidity - (temp_variation * 2) + random.uniform(-3, 3)
        humidity = max(30, min(95, humidity))
        return {
            "deviceId": device_id,
            "sensorType": "DHT22",
            "temperature": round(temperature, 2),
            "humidity": round(humidity, 2),
            "timestamp": datetime.now().isoformat()
        }

    def simulate_soil_moisture(self, device_id: str) -> Dict[str, Any]:
        self.soil_moisture -= random.uniform(0.05, 0.15)
        if random.random() < 0.02:
            self.soil_moisture += random.uniform(15, 25)
            print(f"💧 Irrigation event! Moisture -> {self.soil_moisture:.1f}%")
        self.soil_moisture = max(20, min(70, self.soil_moisture))
        return {
            "deviceId": device_id,
            "sensorType": "SOIL_MOISTURE",
            "soilMoisture": round(self.soil_moisture, 2),
            "timestamp": datetime.now().isoformat()
        }

    def simulate_light_sensor(self, device_id: str) -> Dict[str, Any]:
        hour = self.get_time_factor()
        if 6 <= hour <= 18:
            light_factor = math.sin((hour - 6) * math.pi / 12)
            self.light_intensity = 50000 * light_factor + random.uniform(-2000, 2000)
        else:
            self.light_intensity = random.uniform(0, 100)
        self.light_intensity = max(0, self.light_intensity)
        return {
            "deviceId": device_id,
            "sensorType": "LIGHT",
            "lightIntensity": round(self.light_intensity, 2),
            "timestamp": datetime.now().isoformat()
        }

    def simulate_ph_sensor(self, device_id: str) -> Dict[str, Any]:
        self.ph_level += random.uniform(-0.02, 0.02)
        self.ph_level = max(5.5, min(7.5, self.ph_level))
        return {
            "deviceId": device_id,
            "sensorType": "PH",
            "soilPH": round(self.ph_level, 2),
            "timestamp": datetime.now().isoformat()
        }

    # =============== Các hàm Publish (Giữ nguyên) ===============
    
    def publish_sensor_data(self, device_id: str, data: Dict[str, Any]):
        topic = f"sensor/{device_id}/data"
        payload = json.dumps(data)
        res = self.client.publish(topic, payload, qos=1)
        if res.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"📤 {device_id}: {data.get('sensorType')} sent")
        else:
            print(f"❌ Publish failed for {device_id} with code {res.rc}")

    def publish_device_status(self, device_id: str, status: str):
        topic = f"device/{device_id}/status"
        payload = json.dumps({
            "deviceId": device_id,
            "status": status,
            "timestamp": datetime.now().isoformat()
        })
        self.client.publish(topic, payload, qos=1, retain=False)
        print(f"📡 {device_id} status -> {status}")


def main():
    BROKER_HOST = os.getenv("MQTT_HOST", "localhost")
    BROKER_PORT = int(os.getenv("MQTT_PORT", "1883"))
    MQTT_USER   = os.getenv("MQTT_USER")
    MQTT_PASS   = os.getenv("MQTT_PASS")
    INTERVAL    = int(os.getenv("SIM_INTERVAL", "10"))

    devices = [
        {"id": "DHT22-1018", "type": "DHT22"},
        {"id": "DHT22-2018", "type": "DHT22"},
        {"id": "SOIL-1018",  "type": "SOIL_MOISTURE"},
        {"id": "SOIL-2018",  "type": "SOIL_MOISTURE"},
        {"id": "LIGHT-1018", "type": "LIGHT"},
        {"id": "PH-1018",    "type": "PH"},
    ]

    sim = SensorSimulator(BROKER_HOST, BROKER_PORT, username=MQTT_USER, password=MQTT_PASS)
    sim.run_simulation(devices, INTERVAL)

if __name__ == "__main__":
    main()