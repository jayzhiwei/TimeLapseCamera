import firebase_setup
import firebase_admin
from firebase_admin import firestore
from datetime import datetime, timedelta

# Firestore Reference
db = firestore.client()

def send_timelapse_params(document_id, serial_number, params):
    try:
        # Construct the Firestore path
        collection_path = f"raspberrys/{serial_number}/TimeLapseCase"
        doc_ref = db.collection(collection_path).document(document_id)
        
        # Add a timestamp for tracking
        params["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Update the document with the provided parameters
        doc_ref.set(params)
        print(f"Parameters sent successfully to {collection_path}/{document_id}.")
    
    except Exception as e:
        print(f"Failed to send parameters: {e}")

# Example usage
if __name__ == "__main__":
    # Example parameters
    serial_number = "100000002c5a6b79"
    document_id = "exampleDocID147"
    
    # Dynamically calculate caseStart and caseEnd times
    now = datetime.now()
    case_start = now + timedelta(minutes = 1)  # Start after 1 minute
    case_end = case_start + timedelta(minutes = 1)  # End 1 minute after caseStart
    
    # Format the times for Firestore
    params = {
        "status": "standby",
        "captureTime": "00:00:00_23:59:59",
        "caseStart": case_start.strftime("%Y-%m-%d %H:%M:%S"),
        "caseEnd": case_end.strftime("%Y-%m-%d %H:%M:%S"),
        "timeUnit": "sec",
        "intervalValue": 10,
        "total_pictures": None,
        "resolution": "1080p",
        "created/standby": firestore.SERVER_TIMESTAMP
    }
    
    send_timelapse_params(document_id, serial_number, params)
