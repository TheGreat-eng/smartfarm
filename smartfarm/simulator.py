# File: simulator.py
# (Phiên bản cuối cùng, đã sửa lỗi on_disconnect và cải tiến kết nối)

import paho.mqtt.client as mqtt
import time
import json
import random
from datetime import datetime
import math

# --- CONFIGURATION ---
MQTT_BROKER = "localhost" # Đảm bảo broker đang chạy trên localhost
MQTT_PORT = 1883
PUBLISH_INTERVAL_SECONDS = 10

FARM_ID = 6

# Danh sách các thiết bị cảm biến mà script này sẽ giả lập
DEVICES = [
    {"identifier": "DHT22-1018", "type": "SENSOR_TEMPERATURE", "value": 28.0},
    {"identifier": "DHT22-2018", "type": "SENSOR_HUMIDITY", "value": 75.0},
    {"identifier": "SOIL-1018", "type": "SENSOR_SOIL_MOISTURE", "value": 60.0},
    {"identifier": "LIGHT-1018", "type": "SENSOR_LIGHT", "value": 30000.0}
]

# --- SIMULATION LOGIC  ---

def simulate_sensor_value(device):
    """Giả lập giá trị mới cho cảm biến dựa trên loại và thời gian trong ngày."""
    current_value = device['value']
    noise = random.uniform(-0.5, 0.5)
    hour = datetime.now().hour

    if device['type'] == 'SENSOR_TEMPERATURE':
        base_temp = 35
        amplitude = 8
        daily_variation = amplitude * math.sin((hour - 7) * math.pi / 14) if 7 <= hour <= 21 else -amplitude/2
        new_value = base_temp + daily_variation + noise
        return round(new_value, 2)
    elif device['type'] == 'SENSOR_HUMIDITY':
        new_value = current_value + random.uniform(-1, 1)
        return round(max(40, min(95, new_value)), 2)
    elif device['type'] == 'SENSOR_SOIL_MOISTURE':
        new_value = current_value - 0.1 + noise
        return round(max(10, min(90, new_value)), 2)
    elif device['type'] == 'SENSOR_LIGHT':
        if 6 <= hour < 18:
            base_light = 10000
            amplitude = 40000
            daily_variation = amplitude * math.sin((hour - 6) * math.pi / 12)
            new_value = base_light + daily_variation + (noise * 100)
            return round(max(0, new_value), 0)
        else:
            return round(random.uniform(0, 100), 0)
    return 32.0  # Giá trị mặc định nếu không xác định được loại cảm biến

# --- MQTT CLIENT CALLBACKS ---

connected_flag = False

def on_connect(client, userdata, flags, reason_code, properties):
    """Callback được gọi khi kết nối thành công."""
    global connected_flag
    if reason_code == 0:
        print("✅ Connected to MQTT Broker successfully!")
        connected_flag = True
        control_topic = "smartfarm/control/#"
        client.subscribe(control_topic) 
        print(f"  -> Subscribed to `{control_topic}` to listen for commands.")
    else:
        print(f"❌ Failed to connect, return code {reason_code}\n")
        connected_flag = False

# =========================================================================
# SỬA LỖI CHÍNH LÀ Ở HÀM NÀY
# Định nghĩa lại on_disconnect với đúng 5 tham số của API v2
def on_disconnect(client, userdata, flags, reason_code, properties):
    """Callback được gọi khi mất kết nối."""
    global connected_flag
    # reason_code=None có thể xảy ra khi người dùng chủ động disconnect
    if reason_code is not None and reason_code != 0:
        print(f"🔌 Unexpected disconnection from MQTT Broker with reason code: {reason_code}")
    else:
        print("🔌 Disconnected from MQTT Broker.")
    connected_flag = False
# =========================================================================

def on_message(client, userdata, msg):
    """Callback được gọi khi nhận được một tin nhắn từ topic đã subscribe."""
    print("-" * 20)
    print(f"📩 Command Received!")
    print(f"  Topic:   `{msg.topic}`")
    print(f"  Payload: `{msg.payload.decode()}`")
    
    try:
        device_identifier = msg.topic.split('/')[-1]
        payload = json.loads(msg.payload.decode())
        command = payload.get("command")

        if command == "TURN_ON":
            print(f"  -> Executing: TURN ON device '{device_identifier}'")
        elif command == "TURN_OFF":
            print(f"  -> Executing: TURN OFF device '{device_identifier}'")
        else:
            print(f"  -> Unknown command: '{command}'")

    except Exception as e:
        print(f"   Could not parse or execute command: {e}")
    print("-" * 20)


# --- MAIN SCRIPT EXECUTION ---

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"farm-{FARM_ID}-simulator")
client.on_connect = on_connect
client.on_disconnect = on_disconnect
client.on_message = on_message

try:
    print(f"🔗 Connecting to broker at {MQTT_BROKER}:{MQTT_PORT}...")
    client.connect(MQTT_BROKER, MQTT_PORT)
except Exception as e:
    print(f"❌ Could not connect to MQTT Broker: {e}")
    exit()

client.loop_start()

print("⏳ Waiting for connection...")
while not connected_flag:
    time.sleep(1)
print("🚀 Connection established. Starting data publication.")

try:
    while True:
        if not connected_flag:
            print("...Connection lost, waiting to reconnect...")
            time.sleep(5)
            continue

        print(f"\nPublishing sensor data for Farm ID: {FARM_ID} at {datetime.now()}")
        
        for device in DEVICES:
            device['value'] = simulate_sensor_value(device)
            metric_type = device['type'].replace("SENSOR_", "").lower()
            topic = f"smartfarm/data/{FARM_ID}/{device['identifier']}/{metric_type}"
            payload = json.dumps({"value": device['value']})
            
            result = client.publish(topic, payload, qos=1)
            status = result.rc
            
            if status != 0:
                print(f"   ⚠️  Failed to send message to topic {topic}, status code: {status}")

        time.sleep(PUBLISH_INTERVAL_SECONDS)

except KeyboardInterrupt:
    print("\n🛑 Simulator stopped by user.")
finally:
    client.loop_stop()
    client.disconnect()