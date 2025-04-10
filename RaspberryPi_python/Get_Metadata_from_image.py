import subprocess
import os
from datetime import datetime, timedelta
from PIL import Image, ExifTags

delay_mapping = {
    'Max_View': 0.052,
    '4K_UHD': 0.00,
    '2K_UHD': 0.00,
    '1080p': 0.00,
    '720p': 0.00,
    'SD_480p': 0.00
}

def extract_timestamp_from_image(image_path, selected_resolution):
    try:
        # Open the image and extract EXIF data
        image = Image.open(image_path)
        exif_data = {
            ExifTags.TAGS[k]: v
            for k, v in image._getexif().items()
            if k in ExifTags.TAGS
        }
        
        # Get the DateTimeOriginal field
        datetime_original = exif_data.get("DateTimeOriginal", None)
        
        if datetime_original:
            original_time = datetime.strptime(datetime_original, "%Y:%m:%d %H:%M:%S")
            
            delay = delay_mapping.get(selected_resolution, 0.00)
            adjusted_time = original_time - timedelta(seconds=delay)
            
            return adjusted_time.strftime("%Y%m%d_%H%M%S")
        else:
            return datetime.now().strftime("%Y%m%d_%H%M%S")
    except Exception as e:
        return datetime.now().strftime("%Y%m%d_%H%M%S")

# Call the function with your image path
#print(extract_timestamp_from_image("/home/pi/Desktop/temp_storage/temp_image_0.jpg",'Max_View  '))