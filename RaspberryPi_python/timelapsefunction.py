import firebase_setup
from img2firestorage import upload_images_in_sequence
from readTemp import get_room_temp, get_cpu_temp
from Get_Metadata_from_image import extract_timestamp_from_image
from checkUpdatedUID import fetch_and_update_uid
from networkCheck import wait_for_connection

import firebase_admin
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

import os
import subprocess
import multiprocessing
from datetime import timedelta, datetime
import time
import json
import re
from logging.handlers import RotatingFileHandler
import logging
 
# Initialize Firebase
db = firestore.client()

# Set up logging
log_file = '/home/pi/Desktop/logs/TLfunctionOn9Firebase_log.txt'

# Create a logger
logger = logging.getLogger()  # Get the root logger
logger.setLevel(logging.INFO)  # Set the logging level

# Create a RotatingFileHandler
handler = RotatingFileHandler(log_file, maxBytes=2 * 1024 * 1024, backupCount=5)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')  # Set the format
handler.setFormatter(formatter)  # Add the format to the handler

# Add the handler to the logger
logger.addHandler(handler)

# Define resolutions and delay mapping  
resolutions = {
    'Max_View': (4056, 3040),
    '4K_UHD': (3840, 2160),
    '2K_UHD': (2560, 1440),
    '1080p': (1920, 1080),
    '720p': (1280, 720),
    'SD_480p': (640, 480)
}

# Get serial number
with open("/home/pi/Desktop/serial_number.txt", "r") as f:
    serial_number = f.read().strip()
       
CASE_PATH = f"raspberrys/{serial_number}/TimeLapseCase"
CASE_FILE = "/home/pi/Desktop/case.txt"

def write_case_file(case_doc_id, case_data):
    """Write the case ID and details to the case file."""
    # Exclude unwanted fields
    case_data_filtered = {
        key: value for key, value in case_data.items()
        if key != "createdStandby"  # Skip this specific field
    }
    case_content = {
        "UID": UID,
        "case_doc_id": case_doc_id,
        "case_data": case_data_filtered
    }
    with open(CASE_FILE, "w") as f:
        json.dump(case_content, f)

def read_case_file():
    """Read the case file and return its content."""
    if os.path.exists(CASE_FILE):
        with open(CASE_FILE, "r") as f:
            return json.load(f)
    return None

def clear_case_file():
    if os.path.exists(CASE_FILE):
        os.remove(CASE_FILE)

def time_in_range(capture_time, now):
    start, end = capture_time.split("_")
    start_time = datetime.strptime(start, "%H:%M:%S").time()
    end_time = datetime.strptime(end, "%H:%M:%S").time()
    current_time = now.time().replace(microsecond=0)

    if start_time <= end_time:
        in_range = start_time <= current_time <= end_time
    else:
        in_range = current_time >= start_time or current_time <= end_time

    print(f"Time in range: {in_range} (Start: {start_time}, End: {end_time}, Now: {current_time})")
    return in_range
    

def incremental_sleep(duration, check_interval=0.5, aborted_flag=False):
    """Sleep incrementally, checking for the aborted flag during each interval."""
    elapsed = 0
    while elapsed < duration and not aborted_flag:
#         print(f"Sleeping for {min(check_interval, duration - elapsed)} seconds")
        time.sleep(min(check_interval, duration - elapsed))
        elapsed += check_interval

def process_leftover_files(output_dir):
    """Process leftover files in the output directory."""
    print("Processing leftover files...")
    
    # Pattern to match temp_image files
    temp_image_pattern = re.compile(r"temp_image_(\d+)\.jpg")
    temp_file_path = os.path.join(output_dir, "temp.txt")
    
    # List all files in the directory
    for file_name in os.listdir(output_dir):
        match = temp_image_pattern.match(file_name)
        if match:
            try:
                unprocess_file_path = os.path.join(output_dir, file_name)
                file_base_name = os.path.splitext(file_name)[0]
                resolution = None
                
                # Get the resolution from temp.txt
                if os.path.exists(temp_file_path):
                    with open(temp_file_path, "r") as temp_file:
                        lines = temp_file.readlines()
                    
                    for line in lines:
                        if f"{file_base_name}/" in line:
                            # Parse the resolution from the metadata
                            metadata_str = line.split("metadata=")[-1].strip()
                            metadata = eval(metadata_str)  # Convert metadata string to dictionary
                            resolution = metadata.get("Resolution", None)
                            break
                if not resolution:
                    logging.warning(f"Resolution not found for {file_base_name}. Using default resolution.")
                    resolution = "2K_UHD"  # Default fallback resolution 

                # Extract timestamp from the image
                timestamp = extract_timestamp_from_image(unprocess_file_path,resolution)
                if timestamp:
                    # Rename the file with the extracted timestamp
                    final_file_path = os.path.join(output_dir, f"{timestamp}.jpg")
                    os.rename(unprocess_file_path, final_file_path)
                    print(f"Renamed leftover file {file_name} to {timestamp}.jpg")
                    
                    # Update the metadata in temp.txt
                    if os.path.exists(temp_file_path):
                        with open(temp_file_path, "r") as temp_file:
                            lines = temp_file.readlines()

                        # Replace the line with the new timestamp
                        updated_lines = []
                        
                        for line in lines:
                            if f"{file_base_name}/" in line:
                                updated_line = line.replace(f"{file_base_name}", timestamp)
                                updated_lines.append(updated_line)
                            else:
                                updated_lines.append(line)

                        # Write back the updated lines to temp.txt
                        with open(temp_file_path, "w") as temp_file:
                            temp_file.writelines(updated_lines)
                    
                else:
                    # If no timestamp can be extracted, log and skip or delete
                    logging.error(f"Could not extract timestamp from {file_base_name}. Skipping...")
            except Exception as e:
                logging.error(f"Error processing leftover file {file_name}: {e}")

# Get UID from previous ase.txt first before the new host
case_content = read_case_file()
if case_content:
    UID = case_content["UID"]
else:
    with open("/home/pi/Desktop/UID.txt", "r") as f:
        UID = f.read().strip()

firestore_listeners = {}
active_timelapses = {}  # Track active cases and their abort status

def start_timelapse(case_doc_id, case_data):
    global active_timelapses
    aborted = False

    if case_doc_id in firestore_listeners:
        try:
            firestore_listeners[case_doc_id].unsubscribe()
        except RuntimeError as e:
            print(f"RuntimeError during unsubscribe: {e}")
        finally:
            del firestore_listeners[case_doc_id]
        
    print("start_timeplase running")
    
    status_path = f"{CASE_PATH}/{case_doc_id}"
    write_case_file(case_doc_id, case_data)
    print("write_case_file completed...")
    
    # Extract details
    capture_time = case_data.get("captureTime")
    case_start = datetime.strptime(case_data["caseStart"], "%Y-%m-%d %H:%M:%S")
    case_end = datetime.strptime(case_data["caseEnd"], "%Y-%m-%d %H:%M:%S")
    interval_value = case_data.get("intervalValue")
    time_unit = case_data.get("timeUnit")
    resolution = case_data.get("resolution")

    print(f"1 interval_value = {interval_value} in {time_unit}")

    # Construct proper folder path
    firestorage_path = f"{UID}/{serial_number}/{case_doc_id}"
    print(f"getting firestorage_path= {firestorage_path}")

    last_status = None

    # Listener for abort updates
    def on_case_update(doc_snapshot, changes, read_time):
        nonlocal aborted, last_status
        for doc in doc_snapshot:
            data = doc.to_dict()
            print(f"Firebase Listener Update: {data}")
            current_status = data.get("status")
            if current_status == last_status:
                continue  # Skip redundant updates
            last_status = current_status

            if current_status == "aborted":
                aborted = True
                active_timelapses[case_doc_id]["aborted"] = True
                print(f"Case {case_doc_id} aborted by listener.")

    # Start listening to updates for the case
    case_ref = db.document(status_path)
    case_listener = case_ref.on_snapshot(on_case_update)

    now = datetime.now()
    print(f"{now}")
    try:
        sleep_duration = 0

        if now < case_start and not aborted:
            wait_seconds = (case_start - now).total_seconds()
            print(f"Waiting {wait_seconds} seconds until case_start.")
            print(f"Aborted: {aborted}, Now: {now}, Case Start: {case_start}")
            time.sleep(wait_seconds)
    
        # Time unit conversion
        time_multipliers = {"month": 30*24*3600, "day": 24*3600, "hr": 3600, "min": 60, "sec": 1}
        interval_seconds = interval_value * time_multipliers[time_unit]
        print(f"2 interval_seconds = {interval_seconds} in {time_unit}")
        print("start timelapse function")

        image_count = 0
        while not aborted and now < case_end:

            now = datetime.now()
            print(f"Current Time : {now}")
            print(f"Case_End Time: {case_end}")
            print(f"Aborted Flag : {aborted}")

            if not time_in_range(capture_time, now):
                print(f"Outside capture time range: {now} Sleeping for 1 second...")
                incremental_sleep(1, aborted_flag=aborted)
                continue
            
            print("Capturing image...")
            start_time = datetime.now()
            print(f"start time = {start_time}")

            # Capture and upload image
            try:
                print(f"Capturing image at {start_time}")
                output_dir = "/home/pi/Desktop/temp_storage"

                if not os.path.exists(output_dir):
                    os.makedirs(output_dir)
                
                # Process leftover files before starting new captures
                process_leftover_files(output_dir)

                width, height = resolutions[resolution]

                # Create a temporary filename for the captured image
                temp_output_path = os.path.join(output_dir, f"temp_image_{image_count}.jpg")
                
                # Record initial metadata for the image
                room_temp = get_room_temp()
                cpu_temp = get_cpu_temp()
                temp_file_path = os.path.join(output_dir, "temp.txt")
                formatted_resolution = resolution.replace("_", " ")
                metadata = {
                    "Room": room_temp,
                    "CPU": cpu_temp,
                    "Resolution": formatted_resolution
                }
                    # Remove duplicates in temp.txt
                if os.path.exists(temp_file_path):
                    with open(temp_file_path, "r") as temp_file:
                        lines = temp_file.readlines()

                    # Filter out any duplicate lines
                    filtered_lines = [
                        line for line in lines              
                        if not line.startswith(f"temp_image_")
                    ]

                    # Write back the filtered lines
                    with open(temp_file_path, "w") as temp_file:
                        temp_file.writelines(filtered_lines)
                
                with open(temp_file_path, "a") as temp_file:
                    temp_file.write(f"temp_image_{image_count}/metadata={metadata}\n")

                command = (
                    f"libcamera-still --output {temp_output_path} --width {width} --height {height} "
                    f"--immediate --nopreview"
                )
                _execute_command(command)

                # Generate timestamp and rename the image file
                timestamp = extract_timestamp_from_image(temp_output_path,resolution)
                final_output_path = os.path.join(output_dir, f"{timestamp}.jpg")
                os.rename(temp_output_path, final_output_path)
                print(f"Image saved: {final_output_path}")
                
                # Update the metadata in temp.txt
                with open(temp_file_path, "r") as temp_file:
                    lines = temp_file.readlines()

                # Replace the line with the new timestamp
                updated_lines = []
                for line in lines:
                    if f"temp_image_{image_count}/" in line:
                        updated_line = line.replace(f"temp_image_{image_count}", timestamp)
                        updated_lines.append(updated_line)
                    else:
                        updated_lines.append(line)

                # Write back the updated lines to temp.txt
                with open(temp_file_path, "w") as temp_file:
                    temp_file.writelines(updated_lines)
                    
                upload_images_in_sequence(firestorage_path)
                image_count += 1

            except Exception as e:
                print(f"Unhandled exception occurred: {e}")
                logging.error(f"Error capturing image {image_count}: {e}")
                
            # Calculate elapsed time and adjust sleep duration
            elapsed_time = (datetime.now() - start_time).total_seconds()
            sleep_duration = max(0, interval_seconds - elapsed_time)
            print(f"Calculated Interval Seconds: {interval_seconds}")
            print(f"Elapsed Time: {elapsed_time}, Sleep Duration: {sleep_duration}")
        
            if aborted:
                break

            if datetime.now()+timedelta(seconds=sleep_duration) >= case_end:
                break
            
            else:
                incremental_sleep(sleep_duration, aborted_flag=aborted)
                print(f"Now: {now}, Case End: {case_end}")

    except Exception as e:
            print(f"Unhandled exception occurred: {e}")
            print(f"Error uploading image: {e}")

    finally:
        try:
            print("Entering finally block")
            aborted = active_timelapses.pop(case_doc_id, {}).get("aborted", aborted)
            print(f"aborted = {aborted} \nnow = {now} \ncase_end = {case_end}")

            if not aborted and now >= case_end:
                print("Case not aborted and reached end, breaking loop.")
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                db.document(status_path).update({"status": "completed", "statusUpdated_at": timestamp})
                clear_case_file()
                case_listener.unsubscribe()

            elif not aborted and datetime.now()+timedelta(seconds=sleep_duration) >= case_end:
                print("Case not aborted and reached end, breaking loop.")
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                db.document(status_path).update({"status": "completed", "statusUpdated_at": timestamp})
                clear_case_file()
                case_listener.unsubscribe()

            elif aborted:
                print(f"Case {case_doc_id} aborted. Cleaning up.")
                clear_case_file()
                case_listener.unsubscribe()

            else:
                print("no condition matched!")

        except Exception as e:
            print(f"Exception in finally block: {e}")
            logging.error(f"Exception in finally block: {e}") 

def start_case_listener(case_doc_id):
    """Start a Firestore listener for a specific case."""
    case_ref = db.collection(CASE_PATH).document(case_doc_id)

    def case_on_snapshot(doc_snapshot, changes, read_time):
        for doc in doc_snapshot:
            data = doc.to_dict()
            print(f"Listener triggered for case {case_doc_id} with status {data.get('status')}.")

            if data["status"] == "running":
                if case_doc_id not in active_timelapses:
                    print(f"Starting timelapse for case {case_doc_id}.")
                    start_timelapse(case_doc_id, data)

            elif data["status"] in ["completed", "aborted"]:
                print(f"Case {case_doc_id} completed or aborted. Unsubscribing listener.")
                if case_doc_id in firestore_listeners:
                    try:
                        firestore_listeners[case_doc_id].unsubscribe()
                    except RuntimeError as e:
                        print(f"RuntimeError during unsubscribe: {e}")
                    finally:
                        del firestore_listeners[case_doc_id]

    listener = case_ref.on_snapshot(case_on_snapshot)
    firestore_listeners[case_doc_id] = listener

def monitor_firebase():
    global firestore_listeners

    def on_snapshot(doc_snapshot, changes, read_time):
        global active_timelapses

        for doc in doc_snapshot:
            data = doc.to_dict()
            case_doc_id = doc.id

            # Handle running status
            if data["status"] == "running":
                # Stop listening for this case while it is active
                if case_doc_id in firestore_listeners:
                    print(f"Stopping listener for case {case_doc_id} while it is running.")
                    try:
                        firestore_listeners[case_doc_id].unsubscribe()
                    except RuntimeError as e:
                        print(f"RuntimeError during unsubscribe: {e}")
                    finally:
                        del firestore_listeners[case_doc_id]

                # Add the case to active_timelapses and start it
                if case_doc_id not in active_timelapses:
                    active_timelapses[case_doc_id] = {"aborted": False}
                    print(f"Starting timelapse for case {case_doc_id}.")
                    start_timelapse(case_doc_id, data)

            # Handle completed or aborted status
            elif data["status"] in ["completed", "aborted"]:
                # Cleanup the case from active_timelapses
                if case_doc_id in active_timelapses:
                    print(f"Case {case_doc_id} completed or aborted. Cleaning up.")
                    del active_timelapses[case_doc_id]

                # Resume listening for the case
                if case_doc_id not in firestore_listeners:
                    print(f"Resuming listener for case {case_doc_id}.")
                    start_case_listener(case_doc_id)

    # Set up the initial listener for all cases
    if CASE_PATH not in firestore_listeners:
        query = db.collection(CASE_PATH).where(filter=FieldFilter("status", "in", ["running", "completed", "aborted"]))
        listener = query.on_snapshot(on_snapshot)
        firestore_listeners[CASE_PATH] = listener

def _execute_command(command):
    """Run a shell command."""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"Command executed successfully: {command}")
    except subprocess.CalledProcessError as e:
        logging.error(f"Command failed: {e}")

def main():
    # Resume from case.txt if needed
    # while not stop_event.is_set():
    global firestore_listeners
    case_content = read_case_file()
    if case_content:
        case_doc_id = case_content["case_doc_id"]
        case_data = case_content["case_data"]
        now = datetime.now()
        case_end = datetime.strptime(case_data["caseEnd"], "%Y-%m-%d %H:%M:%S")

        if now < case_end:
            if case_doc_id not in active_timelapses:
                print("from Resume from case.txt if needed starting")
                print(f"{case_doc_id},{case_data}")
                print(f"CASE_PATH")
                start_timelapse(case_doc_id, case_data)
        else:
            print("from Resume from case.txt if needed end already")
            firestorage_path = f"{UID}/{serial_number}/{case_doc_id}"
            upload_images_in_sequence(firestorage_path)
            clear_case_file()

    # Listen for updates
    wait_for_connection()
    fetch_and_update_uid()
    
    monitor_firebase()
        # time.sleep(1)

# if __name__ == "__main__":
#     multiprocessing.set_start_method("spawn")
#     main()