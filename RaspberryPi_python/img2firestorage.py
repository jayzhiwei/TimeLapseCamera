import firebase_setup
from firebase_admin import storage
import os
import ast
import logging
from logging.handlers import RotatingFileHandler

# Set up logging
log_file = '/home/pi/Desktop/logs/img2firestorage_log.txt'

handler = RotatingFileHandler(log_file, maxBytes=2 * 1024 * 1024, backupCount=5)
logging.basicConfig(level=logging.INFO,  # Log INFO level and above
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[handler])
                    
def find_metadata(image_file_name, metadata_file_path):
    """
    Finds and extracts metadata corresponding to an image file name in a metadata file.
    """
    image_name = os.path.splitext(image_file_name)[0]  # Remove .jpg extension
    if not os.path.exists(metadata_file_path):
        logging.error(f"Metadata file {metadata_file_path} does not exist.")
        return None

    try:
        with open(metadata_file_path, "r") as metadata_file:
            lines = metadata_file.readlines()
            for line in lines:
                if line.startswith(image_name + "/"):
                    return line.strip(), lines  # Return the matching line and all lines
    except Exception as e:
        logging.error(f"Error reading metadata file: {e}")
        return None, None

def delete_metadata_line(metadata_file_path, metadata_line):
    """
    Deletes the specified metadata line from the metadata file.
    """
    try:
        with open(metadata_file_path, "r") as metadata_file:
            lines = metadata_file.readlines()

        with open(metadata_file_path, "w") as metadata_file:
            for line in lines:
                if line.strip() != metadata_line:
                    metadata_file.write(line)

        logging.info(f"Deleted metadata line: {metadata_line}")
    except Exception as e:
        logging.error(f"Error deleting metadata line: {e}")

def upload_image(file_path, destination_blob_name, metadata, metadata_file_path, metadata_line):
    """
    Uploads an image to Firebase Storage and deletes the local file and metadata after successful upload.
    """
    bucket = storage.bucket()
    blob = bucket.blob(destination_blob_name)
    blob.metadata = metadata

    try:
        # Upload the image
        blob.upload_from_filename(file_path)
        logging.info(f"File {file_path} uploaded to {destination_blob_name} with metadata: {metadata}.")

        # Delete the local file
        if os.path.exists(file_path):
            os.remove(file_path)
            logging.info(f"File {file_path} has been deleted locally.")

            # Delete the metadata line from temp.txt
            delete_metadata_line(metadata_file_path, metadata_line)
        else:
            logging.warning(f"File {file_path} does not exist locally.")
    except Exception as e:
        logging.error(f"An error occurred during upload: {e}")

def upload_images_in_sequence(firestorage):
    """
    Uploads all images in a folder in ascending order based on filenames.
    """
    metadata_file_path = "/home/pi/Desktop/temp_storage/temp.txt"
    folder_path = "/home/pi/Desktop/temp_storage"
    try:
        # Get a list of all .jpg files in the folder
        files = [f for f in os.listdir(folder_path) if f.endswith(".jpg")]
        files.sort()  # Sort files in ascending order

        for image_file_name in files:
            image_file_path = os.path.join(folder_path, image_file_name)
            destination_blob_name = f"album/{firestorage}/{image_file_name}"  # Destination in Firebase Storage

            # Find metadata
            metadata_line, all_lines = find_metadata(image_file_name, metadata_file_path)
            if metadata_line:
                # Extract metadata part
                metadata = metadata_line.split("/", 1)[1].strip()
                if metadata.startswith("metadata="):
                    metadata = metadata[len("metadata="):]  # Strip the 'metadata=' part
                try:
                    metadata_dict = ast.literal_eval(metadata)
                    # Upload image and delete metadata
                    upload_image(image_file_path, destination_blob_name, metadata_dict, metadata_file_path, metadata_line)
                except Exception as e:
                    logging.error(f"Failed to parse metadata for {image_file_name}: {e}. Skipping upload.")
            else:
                logging.warning(f"No metadata found for {image_file_name}. Skipping upload.")
    except Exception as e:
        logging.error(f"Error during sequential upload: {e}")

# firestorage= 'testingFile2'+'/'+'casetest'
# upload_images_in_sequence(firestorage)