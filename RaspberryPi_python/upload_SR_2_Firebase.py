import firebase_setup
from firebase_admin import firestore
from getSerialNo import read_serial_number_from_file
from logging.handlers import RotatingFileHandler
import logging


db = firestore.client()
file_path = "/home/pi/Desktop/serial_number.txt"

# Data for parent document
data = {
    "UID": None,
    # "UID": "wocOwl6XVPaExHeEnTrTPLyJe0G3",
    "UIDlastModified": firestore.SERVER_TIMESTAMP,
    "registered": firestore.SERVER_TIMESTAMP,
}

serial_number = read_serial_number_from_file(file_path)

try:
    parent_doc_ref = db.collection("raspberrys").document(serial_number)

    # Check if the document exists and the required fields are present
    parent_doc_snapshot = parent_doc_ref.get()
    if parent_doc_snapshot.exists:
        existing_data = parent_doc_snapshot.to_dict()
        if all(key in existing_data for key in ["UID", "UIDlastModified", "registered"]):
            logging.info(f"Fields already exist for document ID [Serial Number]: {serial_number}. Skipping parent update.")
        else:
            # Update only if fields are missing
            parent_doc_ref.update(data)
            logging.info(f"Parent document updated - Serial Number: {serial_number}")
    else:
        # Create the document if it does not exist
        parent_doc_ref.set(data)
        logging.info(f"Parent document created - Serial Number: {serial_number}")
except Exception as e:
    logging.error(f"Failed to update parent document: {e}")
