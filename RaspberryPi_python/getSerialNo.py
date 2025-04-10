import time
from logging.handlers import RotatingFileHandler
import logging

# Configure logging
log_file = '/home/pi/Desktop/logs/getSerialNo_log.txt'
handler = RotatingFileHandler(log_file, maxBytes=2 * 1024 * 1024, backupCount=2)
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[handler])
logger = logging.getLogger(__name__)

def get_serial_number_with_retry(retries=20, delay=2):
    """Retrieve Raspberry Pi serial number with retry mechanism."""
    for attempt in range(retries):
        try:
            with open('/proc/cpuinfo', 'r') as f:
                for line in f:
                    if line.startswith('Serial'):
                        return line.split(':')[1].strip()
        except FileNotFoundError:
            logger.warning(f"Attempt {attempt + 1}/{retries}: Could not retrieve serial number.")
        time.sleep(delay)
    logger.error("Failed to retrieve serial number after multiple attempts.")
    return "ERROR000000000"

def read_serial_number_from_file(file_path):
    """Read the serial number from a file."""
    try:
        with open(file_path, "r") as file:
            return file.read().strip()
    except FileNotFoundError:
        return None

def write_serial_number_to_file(file_path, serial_number):
    """Write the serial number to a file."""
    try:
        with open(file_path, "w") as file:
            file.write(serial_number)
        logger.info(f"Serial number written to file: {file_path}")
    except Exception as e:
        logger.error(f"Error writing serial number to file: {e}")

# Write serial number to file
if __name__ == "__main__":
    file_path = "/home/pi/Desktop/serial_number.txt"
    
    while True:
        # Get the serial number
        serial_number = get_serial_number_with_retry()
        
        if serial_number == "ERROR000000000":
            logger.error("Invalid serial number retrieved. Retrying...")
            continue
        
        # Read the existing serial number from the file
        existing_serial_number = read_serial_number_from_file(file_path)
        
        if existing_serial_number == serial_number:
            logger.info("Serial number matches the existing one.")
            break
        
        # Write the new serial number to the file
        write_serial_number_to_file(file_path, serial_number)
        logger.info("New serial number written.")
        break