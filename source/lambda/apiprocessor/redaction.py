
######################################################################################################################
#  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
#####################################################################################################################

import boto3
import json
import os
from helper import S3Helper

# get the redacted items of this document
def getDocumentRedaction(documentId, bucket):

    redaction = {}
    redaction['uuid'] = documentId
    redaction['redactedItems'] = []
    redaction['headers'] = []
    redaction['footers'] = []
    
    try:
        data = S3Helper.readFromS3(bucket, 'public/' + documentId + '/redaction.json')
        redaction = json.loads(data)
    except Exception as e:
        print("getDocumentRedaction exception: " + str(e))
        return None
    
    return redaction

# retrieve the redacted items of this document
def saveDocumentRedaction(documentId, bucket, body):

    result = {}
    result['status'] = False
    
    # save document redaction if it parses correctly
    try:
        redaction = json.loads(body)
        
        S3Helper.writeToS3(json.dumps(redaction),
                           bucket,
                           'public/' + documentId + '/redaction.json')
    except Exception as e:
        print("saveDocumentRedaction exception: " + str(e))
        return result

    result['status'] = True
    return result


# get the redacted items of this document
def getRedactionGlobal(bucket):
    
    redactionglobal = {}
    redactionglobal['labels'] = []
    redactionglobal['exclusion'] = []
    
    #
    # fetch redaction labels
    #
    try:
        data = S3Helper.readFromS3(bucket, 'redactionglobal/labels.csv')
        lines = data.splitlines()
    
        # remove csv header
        lines.pop(0)
        
        numOfLabels = len(lines)
        
        if numOfLabels > 0:
            for i in range(0, numOfLabels):
                tokens = lines[i].split(',')
                label = {}
                label['name'] = tokens[0]
                label['display'] = tokens[1]
                label['description'] = tokens[2]
                redactionglobal['labels'].append(label)
    except Exception as e:
        print("getRedactionGlobal: no labels.csv found, skipping this step")
    
    #
    # fetch exclusion lists
    #
    allowedFileTypes = set()
    allowedFileTypes.add('csv')

    filenames = S3Helper.getFileNames(bucket, 'redactionglobal/exclusion/', 100, allowedFileTypes)
    numOfFiles = len(filenames)

    # if exclusion lists exist
    if numOfFiles > 0:
        
        # for each exclusion list
        for i in range(0, numOfFiles):
            
            # the list name is the filename (no extension): redactionglobal/exclusion/legal.csv
            listName = filenames[i].split('/')[2].split('.')[0]
            data = S3Helper.readFromS3(bucket, filenames[i])
            lines = data.splitlines()
            # remove csv header
            lines.pop(0)
            
            items = []
            for line in lines:
                tokens = line.split(',')
                item = {}
                item['type'] = tokens[0]
                item['value'] = tokens[1]
                items.append(item)

            list = {}
            list['name'] = listName
            list['items'] = items
            
            redactionglobal['exclusion'].append(list)
    
    return redactionglobal
