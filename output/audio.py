import firebase_admin
from firebase_admin import credentials, firestore, storage
import os

# Initialize Firebase Admin with credentials
cred = credentials.Certificate('memory-recall-5223c-firebase-adminsdk-mui1b-b99187600d.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'memory-recall-5223c.appspot.com'
})

db = firestore.client()
bucket = storage.bucket()

def download_audio_file(subject_id, file_name):
    """Downloads an audio file from Firebase Storage to a local path."""
    try:
        file_path = "audio-recordings/k"
        local_path = "./downloads/k"
        blob = bucket.blob(file_path)
        blob.download_to_filename(local_path)
        print(f"Downloaded {file_path} to {local_path}")
    except Exception as e:
        print(f"Failed to download {file_path}: {e}")

def getTrialDataAndDownloadAudio(subjects):
    # Ensure the download directory exists
    if not os.path.exists('./downloads/'):
        os.makedirs('./downloads/')

    # Loop through each subject and download corresponding audio files
    for subject_id in subjects:
        # Example file names (you might need to adjust the pattern depending on your naming conventions)
        file_name = f"recording-{subject_id}.wav"  # Adjust based on actual filenames
        download_audio_file(subject_id, file_name)

# Example subjects list
subjects = ['k']

# Download audio files for the listed subjects
getTrialDataAndDownloadAudio(subjects)
