
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

import datastore
from helper import S3Helper
import json
import uuid
import boto3
import os


def generateDocumentID(bucketName):
    documentId = str(uuid.uuid4())
    s3Client = boto3.client('s3')
    s3Response = s3Client.list_objects_v2(  # checks for collision
        Bucket=bucketName,
        Prefix='public/{}'.format(documentId),
        MaxKeys=1
    )
    if s3Response.get('Contents') is not None:
        return generateDocumentID(bucketName)
    return documentId


def createDocument(request):
    print("CreateDocument request: {}".format(request))

    documentsTable = request["documentsTable"]
    outputTable = request["outputTable"]
    bucketName = request["bucketName"]
    objectName = request["objectName"]
    pipesRequests = request["pipesRequests"]
    ds = datastore.DocumentStore(documentsTable, outputTable)
    objectRootPrefix = objectName.split('/')[1]
    # if one of the available sample files, backend has to generate UUID.
    if objectRootPrefix == 'samples':
        documentId = generateDocumentID(bucketName)
    else:
        documentId = objectRootPrefix
    ds.createDocument(documentId, bucketName, objectName, pipesRequests)
    output = {
        "documentId": documentId
    }
    return output


def getDocument(request):
    print("GetDocument request: {}".format(request))

    documentsTable = request["documentsTable"]
    outputTable = request["outputTable"]
    documentId = request["documentId"]

    ds = datastore.DocumentStore(documentsTable, outputTable)
    doc = ds.getDocument(documentId)

    output = {}

    if(doc):
        output = doc

    return output


def deleteDocument(request):
    print("DeleteDocument request: {}".format(request))

    documentsTable = request["documentsTable"]
    outputTable = request["outputTable"]
    documentId = request["documentId"]

    ds = datastore.DocumentStore(documentsTable, outputTable)
    ds.deleteDocument(documentId)
