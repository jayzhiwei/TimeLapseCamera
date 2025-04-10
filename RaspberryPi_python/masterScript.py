import multiprocessing
import os
from networkCheck import wait_for_connection

# from checkUpdatedUID import fetch_and_update_uid
import subprocess

def check_serial_number():
    """Check if 'serial_number.txt' exists. If not, run 'getSerialNo.py'."""
    if not os.path.exists("/home/pi/Desktop/serial_number.txt"):
        try:
            result = subprocess.run(
                ["python3", "/home/pi/Desktop/Code_V3/getSerialNo.py"],
                check=True,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print("'serial_number.txt' created successfully")
                return True
            else:
                print(f"Error creating serial number: {result.stderr}")
                return False
        except subprocess.CalledProcessError as e:
            print(f"Failed to generate serial number: {e.stderr}")
            return False
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return False
    else:
        return True

def checkUpdatedUID():
    """Check if 'UID.txt' exists. If not, run 'checkUpdatedUID.py'."""
    if not os.path.exists("/home/pi/Desktop/UID.txt"):
        try:
            result = subprocess.run(
                ["python3", "/home/pi/Desktop/Code_V3/checkUpdatedUID.py"],
                check=True,
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print("'UID.txt' created successfully")
                return True
            else:
                print(f"Error creating UID number: {result.stderr}")
                return False
        except subprocess.CalledProcessError as e:
            print(f"Failed to generate UID number: {e.stderr}")
            return False
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return False
    else:
        print("'UID.txt' already exists")
        return True

# def check_serial_number():
# #Check if 'serial_number.txt' exists. If not, run 'getSerialNo.py'.
#     if not os.path.exists("/home/pi/Desktop/serial_number.txt"):
#         exec(open("/home/pi/Desktop/Code_V3/getSerialNo.py").read())
#         print("'serial_number.txt' get Serial_No complete.")
#     else:
#         print("'serial_number.txt' already exists. Skipping generation step.")

def upload_SR_2_Firebase():
    exec(open("/home/pi/Desktop/Code_V3/upload_SR_2_Firebase.py").read())

def heartbeat(stop_event):
    exec(open("/home/pi/Desktop/Code_V3/heartbeat.py").read())

def Temp_2_Firebase(stop_event):
    exec(open("/home/pi/Desktop/Code_V3/Temp_2_Firebase.py").read())

# def checkUpdatedUID(stop_event):
#     exec(open("/home/pi/Desktop/Code_V3/checkUpdatedUID.py").read())
        
def terminate_processes(processes):
    print("Terminating all processes...")
    for p in processes:
        p.terminate()
        p.join()
        
def check_file_exists(filepath):
    try:
        return os.path.exists(filepath)
    except Exception as e:
        return False

if __name__ == "__main__":
    multiprocessing.set_start_method("spawn")
    stop_event = multiprocessing.Event()
    processes = []

    # Check for required files
    SN_txt_Found = check_file_exists("/home/pi/Desktop/serial_number.txt")
    UID_txt_Found = check_file_exists("/home/pi/Desktop/UID.txt")

    try:
        if SN_txt_Found and UID_txt_Found:
            print("Both 'serial_number.txt' and 'UID.txt' are found.\nStarting parallel processes...")
        else:
            print("Required files missing. Running setup...")

            if SN_txt_Found == False:
                check_serial_number()
            else:
                print("'serial_number.txt' already exists")

            wait_for_connection()

            from RaspNetworkUpdate import push_Network_data_to_firestore
            def RaspNetworkUpdate():
                push_Network_data_to_firestore()
            RaspNetworkUpdate()
            upload_SR_2_Firebase()

            if UID_txt_Found == False:
                checkUpdatedUID()

        from RaspNetworkUpdate import push_Network_data_to_firestore
        def RaspNetworkUpdate():
            push_Network_data_to_firestore()

    # Start parallel processes
        p1 = multiprocessing.Process(target=heartbeat, args=(stop_event,))
        p2 = multiprocessing.Process(target=Temp_2_Firebase, args=(stop_event,))
        p4 = multiprocessing.Process(target=checkUpdatedUID())
        p5 = multiprocessing.Process(target=RaspNetworkUpdate())
        
        processes = [p1, p2, p4, p5]

        for p in processes:
            p.start()
            
        from timelapsefunction import main
        def timelapsefunction():
            print("timelapsefunction has started")
            main()
        p3 = multiprocessing.Process(target=timelapsefunction())
        processes.append(p3)

    # Wait for processes
        for p in processes:
            p.join()

    except KeyboardInterrupt:
        print("KeyboardInterrupt detected. Stopping processes...")
        terminate_processes(processes)