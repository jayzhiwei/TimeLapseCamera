import firebase_setup
from firebase_admin import firestore
from datetime import datetime
import subprocess
import requests
from logging.handlers import RotatingFileHandler
import logging
import os

# Configure logging
log_file = '/home/pi/Desktop/logs/RaspInfo2Firebase_log.txt'
handler = RotatingFileHandler(log_file, maxBytes=2 * 1024 * 1024, backupCount=5)
logging.basicConfig(level=logging.INFO,  # can change the level to DEBUG, INFO, WARNING, etc.
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[handler])
logger = logging.getLogger(__name__)

# Firestore Reference
db = firestore.client()

def check_file_exists(filepath):
    try:
        return os.path.exists(filepath)
    except Exception as e:
        return False

with open("/home/pi/Desktop/serial_number.txt", "r") as f:
    serial_number = f.read().strip() #
# #     serial_number = "000003035664"

def get_location_by_ip():
    try:
        response = requests.get("https://ipinfo.io/json")
        data = response.json()
        country = data.get("country", "Unknown")
        city = data.get("city", "Unknown")
        return country, city
    except Exception as e:
        logger.error(f"Error getting location: {e}")
        return "Unknown", "Unknown"

def get_active_interface():
    """Check which network interface is active."""
    try:
        result = subprocess.check_output(["ip", "route", "show", "default"], universal_newlines=True)
        if "eth0" in result:
            return "eth0"
        elif "wlan0" in result:
            return "wlan0"
        else:
            return None
    except Exception as e:
        logger.error(f"Error checking active interface: {e}")
        return None

def push_Network_data_to_firestore():
    parent_doc_ref = db.collection("raspberrys").document(serial_number)
    
    if serial_number == "ERROR000000000":
        logger.error("Exiting: Unable to retrieve a valid serial number.")
    
    active_interface = get_active_interface()
    
    if not active_interface:
        logger.error("No active network interface detected.")
        return
    
    country, city = get_location_by_ip()

    # Always check and conditionally update the network sub-collection
    if active_interface == "eth0":
        network_data = {
            "Interface": "ethernet",
            "City": city,
            "Country": country,
            "timeAdd": firestore.SERVER_TIMESTAMP,
        }
        try:
            network_ref = parent_doc_ref.collection("network").document("eth0")
            network_snapshot = network_ref.get()
            if network_snapshot.exists:
                existing_network_data = network_snapshot.to_dict()
                if (
                    existing_network_data.get("City") == city
                    and existing_network_data.get("Country") == country
                    and existing_network_data.get("Interface") == "ethernet"
                ):
                    logger.info("Network data for eth0 is already up-to-date. Updating newest connection date.")
                    network_ref.update({"timeAdd": firestore.SERVER_TIMESTAMP})
                    return
            network_ref.set(network_data)
            logger.info(f"Network data updated for eth0 - City: {city}, Country: {country}")
        except Exception as e:
            logger.error(f"Failed to add/update network data for eth0: {e}")

    elif active_interface == "wlan0":
        try:
            ssid = subprocess.check_output(["iwgetid", "-r"], universal_newlines=True).strip()
        except subprocess.CalledProcessError:
            ssid = "Unknown_SSID"
            logger.warning("Failed to retrieve SSID. Using default value.")

        network_data = {
            "Interface": "wireless LAN",
            "City": city,
            "Country": country,
            "timeAdd": firestore.SERVER_TIMESTAMP,
        }
        try:
            network_ref = parent_doc_ref.collection("network").document(ssid)
            network_snapshot = network_ref.get()
            if network_snapshot.exists:
                existing_network_data = network_snapshot.to_dict()
                if (
                    existing_network_data.get("City") == city
                    and existing_network_data.get("Country") == country
                    and existing_network_data.get("Interface") == "wireless LAN"
                ):
                    logger.info(f"Network data for SSID '{ssid}' updating newest connection date.")
                    network_ref.update({"timeAdd": firestore.SERVER_TIMESTAMP})
                    return
            network_ref.set(network_data)
            logger.info(f"Network data updated for SSID '{ssid}' - City: {city}, Country: {country}")
        except Exception as e:
            logger.error(f"Failed to add/update network data for wlan0: {e}")

# Main
# if __name__ == "__main__":
#     push_Network_data_to_firestore()