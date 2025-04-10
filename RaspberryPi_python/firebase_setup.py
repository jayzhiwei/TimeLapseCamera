import firebase_admin
from firebase_admin import credentials
from firebase_admin.exceptions import FirebaseError

# Initialize Firebase Admin SDK
try:
    firebase_admin.get_app()  # Check if the app is already initialised
#     print("Firebase Admin SDK already initialised.")
except ValueError:
#     print("Initialising Firebase Admin SDK...")
    cred = credentials.Certificate("/home/pi/Desktop/timelapsefyp2024-firebase-adminsdk-xrb4a-337ff8b2ad.json")
    firebase_admin.initialize_app(cred,{
    "storageBucket": "timelapsefyp2024.appspot.com",
    "databaseURL": "https://timelapsefyp2024-default-rtdb.asia-southeast1.firebasedatabase.app/"
})
#     print("Firebase Admin SDK initialised.")