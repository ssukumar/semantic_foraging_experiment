# -*- coding: utf-8 -*-

import csv
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore


# Use a service account
cred = credentials.Certificate('memory-recall-5223c-firebase-adminsdk-mui1b-b99187600d.json') # **TODO** input your secret key into the certificate
firebase_admin.initialize_app(cred)
db = firestore.client()

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
    header = ('StartTime', 'Subject ID', 'Age', 'Clamp Question', 'Comments', 'Completed Trials', 'Handedness', 'Ethnicity', 'Mouse Type', 'Race', 'Returner', 'Sex', 'Browsertype')
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
                currDate_arr = fields.get('startTime')
                time = fields.get('time')
                category = fields.get('categoryname')
                score = fields.get('score')
                totalscore = fields.get('totalscore')

                trial = (exp_ID, name, currDate_arr, time, category, score, totalscore)
                # print(trial)
                trials.append(trial)


    return trials


def getTrialData(collection, numTrials, csvFileName, subjects, db):

    trials = trialcsvread(collection, numTrials, csvFileName, subjects, db)

    #Set up file to write to
    file = open(csvFileName, 'w')
    writer = csv.writer(file)
    header = ('Experiment Name', 'Subject ID', 'Start Time', 'time', 'categoryname', 'score', 'totalscore')

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

subjects =['k']

getSubjectData(subjects,'kiely.csv', db, 'Subjects')

getTrialData('Trials',26, 'kielydata.csv', subjects, db)