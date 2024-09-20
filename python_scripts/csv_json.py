import csv, json

def jsonFromCsv(csvFilePath, jsonFilePath):
    # JSON objects
    jsonData = {}
    trialNums = {}
    items = {}
    
    file = open(csvFilePath, 'r')
    reader = csv.reader(file)
    headings = next(reader) # Ensures we don't read the headings again
    rowCount = 1
    for row in reader:
        trialNums[rowCount] = int(row[0])
        items[rowCount] = str(row[1])
        rowCount += 1
    file.close()

    jsonData["numtrials"] = rowCount
    jsonData["items"] = items
 
    for key in jsonData.keys():
        print ("key: ", key)
        print ("value: ", jsonData[key])
        print ("")

    with open(jsonFilePath, 'w') as outfile:
        json.dump(jsonData, outfile)


"""
Please reference 'tbt_tgtfile_04272020_V2.csv' for how csv files should be formatted.
"""
csvFilePath = '../csv_tgt_files/multiclamp_demo_csv_file.csv'
jsonFilePath = '../public/tgt_files/multiclamp_demo.json'

jsonFromCsv(csvFilePath, jsonFilePath)

