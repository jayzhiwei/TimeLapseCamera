import firebase_setup
from firebase_admin import firestore
import os
import time

# Firestore Reference
db = firestore.client()
file_path = "/home/pi/Desktop/UID.txt"

# Write UID to a Text File
def write_uid_to_file(uid):
    try:
        with open(file_path, "w") as file:
            file.write(f"{uid}")
        print(f"UID written to file: {file_path}")
    except Exception as e:
        print(f"Error writing UID to file: {e}")

# Read File Function
def read_file(file_path):
    try:
        with open(file_path, 'r') as file:
            content = file.read()  # Read the entire file content
            print(f"{file_path}   :", content)
            return content.strip()  # Remove any extra spaces or newlines
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
    except Exception as e:
        print(f"Error reading file: {e}")

# Fetch Document and Update UID
def fetch_and_update_uid():
    serial_number = read_file("/home/pi/Desktop/serial_number.txt")
    if not serial_number:
        print("Serial number is missing. Please check the file.")
        return
    current_uid = read_file(file_path)
    while True:  # Keep checking Firestore for updates
        try:
            doc_ref = db.collection("raspberrys").document(serial_number)
            doc = doc_ref.get()

            if doc.exists:
                doc_data = doc.to_dict()
                uid = doc_data.get("UID")
                if uid:
                    print(f"Retrieved UID from firebase: {uid}")
                    if uid == current_uid:
                        print("UID is the same as the current UID. Skipping update.")
                        break
                    else:
                        write_uid_to_file(uid)
                        break  # Exit the loop once UID is not NULL
                else:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    print("UID field is missing or NULL. UID.txt removed.")
            else:
                print(f"No document found for serial number: {serial_number}")

        except Exception as e:
            print(f"Error fetching document: {e}")

        time.sleep(5)  # Wait for 5 seconds before checking again

if __name__ == "__main__":
    fetch_and_update_uid()