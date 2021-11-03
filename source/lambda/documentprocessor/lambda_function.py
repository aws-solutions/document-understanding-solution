
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

import json
import os
import filetype
from helper import FileHelper, AwsHelper
import datastore
import boto3

ASYNC_JOB_TIMEOUT_SECONDS = 900
SYNC_JOB_TIMEOUT_SECONDS = 180


def postMessage(client, qUrl, jsonMessage, delaySeconds=0):

    message = json.dumps(jsonMessage)

    client.send_message(
        QueueUrl=qUrl,
        MessageBody=message,
        DelaySeconds=delaySeconds
    )
    print("Submitted message to queue: {}".format(message))


def get_mime_type(bucketName, objectName):
    """
    Utilizes magic number checking via the 'filetype' library to determine if the files are of a valid type.
    """
    client = boto3.client('s3')
    local_path = f"/tmp/{objectName.rsplit('/',1)[-1]}"
    client.download_file(bucketName,
                         objectName, local_path)

    return filetype.guess(local_path)


def processRequest(documentId, bucketName, objectName, processingQueueUrl, errorHandlerTimeoutSeconds, jobErrorHandlerQueueUrl):

    output = ""
    print("Request: documentId {}, bucketName {}, objectName {}, processingQueueUrl {}, errorHandlerTimeoutSeconds {}, jobErrorHandlerQueueUrl {}".format(documentId, bucketName, objectName, processingQueueUrl, errorHandlerTimeoutSeconds, jobErrorHandlerQueueUrl))

    print("Input Object: {}/{}".format(bucketName, objectName))

    client = AwsHelper().getClient('sqs')

    features = ["Text", "Forms", "Tables"]
    jsonMessage = {'documentId': documentId,
                   "features": features,
                   'bucketName': bucketName,
                   'objectName': objectName}
    postMessage(client, processingQueueUrl, jsonMessage)

    jsonErrorHandlerMessage = {
        'documentId': documentId
    }
    postMessage(client, jobErrorHandlerQueueUrl,
                jsonErrorHandlerMessage, errorHandlerTimeoutSeconds)

    output = "Completed routing for documentId: {}, object: {}/{}, to {}".format(
        documentId, bucketName, objectName, processingQueueUrl)


def processRecord(record, syncQueueUrl, syncBarcodeQueueUrl, asyncQueueUrl, errorHandlerQueueUrl):

    newImage = record["dynamodb"]["NewImage"]

    documentId = None
    bucketName = None
    objectName = None
    documentStatus = None

    if("documentId" in newImage and "S" in newImage["documentId"]):
        documentId = newImage["documentId"]["S"]
    if("bucketName" in newImage and "S" in newImage["bucketName"]):
        bucketName = newImage["bucketName"]["S"]
    if("objectName" in newImage and "S" in newImage["objectName"]):
        objectName = newImage["objectName"]["S"]
    if("documentStatus" in newImage and "S" in newImage["documentStatus"]):
        documentStatus = newImage["documentStatus"]["S"]

    print("DocumentId: {}, BucketName: {}, ObjectName: {}, DocumentStatus: {}".format(
        documentId, bucketName, objectName, documentStatus))

    if(documentId and bucketName and objectName and documentStatus):
        file_type = get_mime_type(bucketName, objectName)
        client = AwsHelper().getClient('sqs')

        # If not expected extension, change status to FAILED and exit
        if not file_type or file_type.mime not in ['application/pdf', 'image/png', 'image/jpeg']:
            jsonErrorHandlerMessage = {
                'documentId': documentId
            }
            postMessage(client, errorHandlerQueueUrl, jsonErrorHandlerMessage)
            return

        # trigger the sync or async textract pipeline
        if (file_type.mime in ['image/png', 'image/jpeg']):
            # sync textract pipeline
            processRequest(documentId, bucketName, objectName, syncQueueUrl, SYNC_JOB_TIMEOUT_SECONDS,
                           errorHandlerQueueUrl)
        elif (file_type.mime in ['application/pdf']):
            # async textract pipeline
            processRequest(documentId, bucketName, objectName, asyncQueueUrl, ASYNC_JOB_TIMEOUT_SECONDS,
                           errorHandlerQueueUrl)

        # barcode pipeline accepts both pdf or images
        if syncBarcodeQueueUrl:
            processRequest(documentId, bucketName, objectName, syncBarcodeQueueUrl, ASYNC_JOB_TIMEOUT_SECONDS,
                        errorHandlerQueueUrl)

def lambda_handler(event, context):

    try:

        print("Event: {}".format(event))

        syncQueueUrl = os.environ['SYNC_QUEUE_URL']
        syncBarcodeQueueUrl = os.getenv('SYNC_BARCODE_QUEUE_URL', None)
        asyncQueueUrl = os.environ['ASYNC_QUEUE_URL']
        errorHandlerQueueUrl = os.environ['ERROR_HANDLER_QUEUE_URL']

        if("Records" in event and event["Records"]):
            for record in event["Records"]:
                try:
                    print("Processing record: {}".format(record))

                    if("eventName" in record and record["eventName"] == "INSERT"):
                        if("dynamodb" in record and record["dynamodb"] and "NewImage" in record["dynamodb"]):
                            processRecord(record, syncQueueUrl, syncBarcodeQueueUrl,
                                          asyncQueueUrl, errorHandlerQueueUrl)

                except Exception as e:
                    print("Failed to process record. Exception: {}".format(e))

    except Exception as e:
        print("Failed to process records. Exception: {}".format(e))
