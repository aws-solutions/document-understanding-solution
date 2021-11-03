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

import os
from pathlib import Path

from docbarcodes.extract import process_document
import datastore
from helper import AwsHelper, S3Helper, DynamoDBHelper

import boto3

s3 = boto3.client('s3')

import tempfile

import json

PUBLIC_PATH_S3_PREFIX= "public/"
SERVICE_OUTPUT_PATH_S3_PREFIX = "output/"
BARCODES_PATH_S3_PREFIX = "barcodes/"

def processPDF(documentId, features, bucketName, outputBucketName, objectName, outputTableName, documentsTableName):

    with tempfile.TemporaryDirectory() as d:
        s3 = boto3.client('s3')
        target = os.path.join(d, objectName)
        os.makedirs(Path(target).parent, exist_ok=True)
        s3.download_file(bucketName, objectName, target)

        barcodes_raw, barcodes_combined = process_document(target, max_pages=None, use_jpype=True)

        # convert to savable json response
        raw_dict = [b._asdict() for b in barcodes_raw]
        combined_dict = [b._asdict() for b in barcodes_combined]

        response = {"BarcodesRaw": raw_dict, "BarcodesCombined": combined_dict}

        outputPath = '{}{}/{}{}barcodes.json'.format(PUBLIC_PATH_S3_PREFIX, documentId, SERVICE_OUTPUT_PATH_S3_PREFIX,
                                                     BARCODES_PATH_S3_PREFIX)
        print("Generating output for DocumentId: {} and storing in {}".format(documentId, outputPath))

        S3Helper.writeToS3(json.dumps(response, ensure_ascii=False), outputBucketName, outputPath)

        # store the output path of the generated barcode file in dynamodb
        dynamodb = AwsHelper().getResource("dynamodb")
        ddb = dynamodb.Table(outputTableName)

        jsonItem = {}
        jsonItem['documentId'] = documentId
        jsonItem['outputType'] = "barcodes/Response"
        jsonItem['outputPath'] = outputPath
        ddbResponse = ddb.put_item(Item=jsonItem)

        ds = datastore.DocumentStore(documentsTableName, outputTableName)
        ds.updateDocumentPipesFinished(documentId, ["barcodes"])
        ds.markDocumentComplete(documentId)


# --------------- Main handler ------------------


def processRequest(request):
    output = ""

    print("Request: {}".format(request))

    bucketName = request['bucketName']
    objectName = request['objectName']
    features = request['features']
    documentId = request['documentId']
    outputBucketName = request['outputBucketName']
    outputTable = request['outputTable']
    documentsTable = request["documentsTable"]

    if (documentId and bucketName and objectName and features):
        print("DocumentId: {}, features: {}, Object: {}/{}".format(documentId,
                                                                   features, bucketName, objectName))
        processPDF(documentId, features, bucketName, outputBucketName,
                   objectName, outputTable, documentsTable)

        output = "Document: {}, features: {}, Object: {}/{} processed.".format(
            documentId, features, bucketName, objectName)

    return {
        'statusCode': 200,
        'body': output
    }

def handler(event, context):
    print("Event: {}".format(event))
    message = json.loads(event['Records'][0]['body'])
    print("Message: {}".format(message))

    request = {}
    request["documentId"] = message['documentId']
    request["bucketName"] = message['bucketName']
    request["objectName"] = message['objectName']
    request["features"] = message['features']
    request["outputBucketName"] = os.environ['OUTPUT_BUCKET']
    request["outputTable"] = os.environ['OUTPUT_TABLE']
    request["documentsTable"] = os.environ['DOCUMENTS_TABLE']

    return processRequest(request)
