import firebase_setup
from firebase_admin import db
import time

with open("/home/pi/Desktop/serial_number.txt", "r") as f:
    serial_number = f.read().strip()
#     serial_number = "000003035664"

ref = db.reference(f'raspberrys/{serial_number}')

while True:
    try:
        # Update device status to 'online' every 5 seconds
        ref.update({
            'timestamp': time.time()
        })
        print("updated")
    except Exception as e:
        print(f"Error updating status: {e}")
    time.sleep(2*60)  # Heartbeat interval (adjust as needed)
