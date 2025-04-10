import firebase_setup
from firebase_admin import firestore

with open("/home/pi/Desktop/serial_number.txt", "r") as f:
    serial_number = f.read().strip()

# Firestore Reference
db = firestore.client()

def delete_temperature_logs():
    try:
        # Debugging: Print the serial number
        print(f"Serial number: {serial_number}")

        # Reference to the specific collection
        temperature_log_ref = db.collection("raspberrys").document(serial_number).collection("TemperatureLog")

        # Correct usage of the stream() method
        docs = list(temperature_log_ref.limit(10).stream())  # Ensure `.stream()` is called as a method
        print(f"Fetched {len(docs)} documents from Firestore.")

        if not docs:
            print("No temperature logs found to delete.")
            return

        deleted_count = 0

        # Delete each document
        for doc in docs:
            print(f"Deleting Document ID: {doc.id}")
            doc.reference.delete()
            deleted_count += 1

        print(f"Deleted {deleted_count} temperature log(s).")

    except Exception as e:
        print(f"Error during deletion: {e}")

# Call the function to delete the logs
delete_temperature_logs()
