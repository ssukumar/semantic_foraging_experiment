import firebase_admin
from firebase_admin import credentials, firestore, storage
import os

# Initialize Firebase Admin with credentials
cred = credentials.Certificate('memory-recall-5223c-firebase-adminsdk-mui1b-e96c89aa47.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'memory-recall-5223c.appspot.com'
})

db = firestore.client()
bucket = storage.bucket()

def download_audio_files_in_folder(folder_name):
    """Downloads all .wav audio files from a specific folder in Firebase Storage to a local directory."""
    try:
        # Define the local download path
        local_dir = folder_name
        if not os.path.exists(local_dir):
            os.makedirs(local_dir)

        # List all files in the folder
        blobs = bucket.list_blobs(prefix=folder_name)

        # Loop through the files and download only .wav files
        for blob in blobs:
            if blob.name.endswith('.webm'):
                file_name = os.path.basename(blob.name)
                local_path = os.path.join(local_dir, file_name)
                blob.download_to_filename(local_path)
                print(f"Downloaded {blob.name} to {local_path}")
            if blob.name.endswith('.csv'):
                file_name = os.path.basename(blob.name)
                local_path = os.path.join(local_dir, file_name)
                blob.download_to_filename(local_path)
                print(f"Downloaded {blob.name} to {local_path}")
    except Exception as e:
        print(f"Failed to download files from {folder_name}: {e}")

# Download audio files from the folder
download_audio_files_in_folder('audio-recordings/0925wed')

download_audio_files_in_folder('transcripts/0925wed')
