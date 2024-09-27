# -*- coding: utf-8 -*-

import csv
import firebase_admin
from firebase_admin import credentials, firestore, storage
import os


# Use a service account
cred = credentials.Certificate('memory-recall-5223c-firebase-adminsdk-mui1b-e96c89aa47.json') # **TODO** input your secret key into the certificate
firebase_admin.initialize_app(cred, {
    'storageBucket': 'memory-recall-5223c.appspot.com'
})
db = firestore.client()
bucket = storage.bucket()

def subjcsvread(subjects, csvFileName, db, collection):
    subjectList = []
    for subj in subjects:

        try:
            docs = db.collection(collection).where(u'id', u'==',subj).stream()

            for doc in docs:
                fields = doc.to_dict()
                info = (fields.get('start_time'), fields.get('id'), fields.get('age'), fields.get('comments'), fields.get('currTrial'), fields.get('handedness'), fields.get('ethnicity'), fields.get('race'), fields.get('returner'), fields.get('sex'), fields.get('browsertype'))
                subjectList.append(info)
        except:
            print(subj + "doesn't exist!")
            continue

    return subjectList

def getSubjectData(subjects, csvFileName, db, collection):

    subjectList = subjcsvread(subjects, csvFileName, db, collection)

    #Set up file to write to
    file = open(csvFileName, 'w')
    writer = csv.writer(file)
    header = ('StartTime', 'Subject ID', "trials", 'Age', 'Clamp Question', 'Comments', 'Completed Trials', 'Handedness', 'Ethnicity', 'Mouse Type', 'Race', 'Returner', 'Sex', 'Browsertype')
    writer.writerow(header)
    writer.writerows(subjectList)
    file.close()

def addSubjectData(subjects, csvFileName, db, collection):
    subjectList = subjcsvread(subjects, csvFileName, db, collection)

    #Set up file to write to
    file = open(csvFileName, 'a')
    writer = csv.writer(file)
    writer.writerows(subjectList)
    file.close()


def trialcsvread(collection, numTrials, csvFileName, subjects, db):
    #Create array with complete set of id's in database
    #Comment out this portion if you are not using 'id' as your field
    ids = []
    for subj in subjects:
      i=int(numTrials/1)
      for n in range(1,i+1):
            m=n*1
            ids.append(subj + str(m))
            # print(ids)

    #Create array with complete set of id's in database
    trials = []
    for trialID in ids:
        # try:
            docs = db.collection(collection).where(u'id', u'==', trialID).stream()

            for doc in docs:
                # print(trialID)
                fields = doc.to_dict()
                exp_ID = fields.get('experimentID')
                name = fields.get('id')
                trialnum = fields.get('trialNum')
                currDate_arr = fields.get('startTime')
                time = fields.get('time')
                category = fields.get('categoryname')
                score = fields.get('score')
                scoretime = fields.get('scoreTime')
                switchtime = fields.get('switchTime')
                partshape = fields.get('partshape')
                partshapenum = fields.get('partshapeNum')
                trueshape = fields.get('trueshape')
                trueshapenum = fields.get('trueshapeNum')
                result = fields.get('result')
                totalscore = fields.get('totalscore')
                minusscore = fields.get('minusscore')
                money = fields.get('money')

                trial = (exp_ID, name, trialnum, currDate_arr, time, category, score, scoretime, switchtime, partshape, partshapenum, trueshape, trueshapenum, result, totalscore, minusscore, money)
                # print(trial)
                trials.append(trial)


    return trials


def getTrialData(collection, numTrials, csvFileName, subjects, db):

    trials = trialcsvread(collection, numTrials, csvFileName, subjects, db)

    #Set up file to write to
    file = open(csvFileName, 'w')
    writer = csv.writer(file)
    header = ('Experiment Name', 'Subject ID', 'trials','Start Time', 'time', 'categoryname', 'score', 'scoretime', 'switchtime', 'partshape', 'partshapenum', 'trueshape', 'trueshapenum', 'result', 'totalscore', 'minusscore', 'money' )

    writer.writerow(header)
    writer.writerows(trials)
    file.close()

def addTrialData(collection, numTrials, csvFileName, subjects, db):

    #Create array with complete set of id's in database
    trials = trialcsvread(collection, numTrials, csvFileName, subjects, db)

    #Set up file to write to

    file = open(csvFileName, 'a')
    writer = csv.writer(file)
    emptyrow = []

    #writer.writerow(emptyrow)
    writer.writerows(trials)
    file.close()

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

subjects =['WQJBEK']

getSubjectData(subjects,'information/part0926.csv', db, 'Subjects')
getTrialData('Trials',26, 'information/part0926data.csv', subjects, db)

# Download audio files from the folder
download_audio_files_in_folder('audio-recordings/0926wed')
download_audio_files_in_folder('audio-recordings/WQJBEK')

download_audio_files_in_folder('transcripts/0926wed')
download_audio_files_in_folder('transcripts/WQJBEK')

