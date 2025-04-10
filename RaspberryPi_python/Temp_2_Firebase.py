import firebase_setup
from firebase_admin import firestore
import time
from readTemp import get_room_temp, get_cpu_temp

with open("/home/pi/Desktop/serial_number.txt", "r") as f:
    serial_number = f.read().strip()
#     serial_number = "000003035664"

# Firestore Reference
db = firestore.client()

last_room_temp = None
last_cpu_temp = None

while True:
    try:
        # Get the current temperature readings
        current_room_temp = get_room_temp()
        current_cpu_temp = get_cpu_temp()
#         print(current_room_temp)
#         print(current_cpu_temp)

        # Check if the temperature difference exceeds thresholds
        send_data = False
        if last_room_temp is None or abs(current_room_temp - last_room_temp) > 0.5:
            send_data = True
            last_room_temp = current_room_temp

        if last_cpu_temp is None or abs(current_cpu_temp - last_cpu_temp) > 2:
            send_data = True
            last_cpu_temp = current_cpu_temp

        # If a significant change is detected, send data to Firestore
        timestamp = time.strftime("%Y-%m-%d_%H:%M:%S")
        if send_data:
            live_data = {
                'Room': current_room_temp,
                'CPU': current_cpu_temp,
                'createAt':firestore.SERVER_TIMESTAMP,
            }

            # Add data to Firestore under the specific path
            db.collection("raspberrys").document(serial_number).collection("TemperatureLog").document(timestamp).set(live_data)
            print(f"Uploaded to Firestore: {live_data}")
        
        # Wait for 1 second before checking again
        time.sleep(1)

    except KeyboardInterrupt:
        print("Data upload stopped by user.")
        break

    except Exception as e:
        print(f"Error: {e}")
        time.sleep(5)
