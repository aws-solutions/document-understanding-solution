
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
from botocore.exceptions import ClientError
import json
import os
import uuid
from helper import FileHelper, AwsHelper, S3Helper
from datastore import DocumentStore
from urllib.parse import unquote_plus


def generateDocumentID(bucketName, s3Client):
    documentId = str(uuid.uuid4())

    response = s3Client.list_objects_v2(Bucket=bucketName,
                                        Prefix='public/{}'.format(documentId),
                                        MaxKeys=1)

    if response.get('Contents') is not None:
        return generateDocumentID(bucketName)

    return documentId


def downloadDocument(bucketName, documentKey, filename, s3Client):

    # create a local file
    datafile = open('/tmp/' + filename, 'wb') # nosec B108

    # system error
    if datafile == None:
        print("Download Document: failed to open local file: " + filename)
        return False

    # download s3 object into local file
    try:
        s3Client.download_fileobj(bucketName, documentKey, datafile)
    except Exception as e:
        print("Download Document: " + str(e))
        return False

    return True


def uploadDocument(bucketName, documentKey, filename, s3Client):

    # open local file
    datafile = open('/tmp/' + filename, 'rb') # nosec B108

    if datafile == None:
        print("UploadDocument: failed to open local file: " + filename)
        return False

    # upload local file to s3
    s3Client.upload_fileobj(datafile, bucketName, documentKey)
    return True


def processDocument(record):

    print("Document object : {}".format(str(record['s3']['object']['key'])))

    ingestionBucketName = record['s3']['bucket']['name']
    ingestionDocumentKey = record['s3']['object']['key']
    ingestionDocumentFilename = record['s3']['object']['key'].split('/')[1]
    ingestionDocumentFilename = unquote_plus(ingestionDocumentFilename)
    ingestionDocumentKey = unquote_plus(ingestionDocumentKey)

    s3Client = boto3.client('s3', region_name=os.environ['AWS_REGION'])

    # get document from bulk bucket
    ret = downloadDocument(ingestionBucketName,
                           ingestionDocumentKey,
                           ingestionDocumentFilename,
                           s3Client)

    # error trying to dowload document, exit
    if ret == False:
        print("ProcessDocument: failed to download locally document:" +
              ingestionDocumentKey)
        return

    # attempt to get an optional document Kendra policy json file
    policyFilename = ingestionDocumentFilename + ".metadata.json"
    policyKey = "kendraPolicyDrop/" + policyFilename

    s3helper = S3Helper()
    policyData = None

    # try to fetch amd load the policy
    try:

        policyData = s3helper.readFromS3(ingestionBucketName,
                                         policyKey,
                                         os.environ['AWS_REGION'])

    # the normal case of a file not provided is handled.  If any other error
    # occur the indexing will proceed without the membership tags in the policy file
    except ClientError as e:
        policyData = None
        # NoSuchKey is the expected exception when no policy provided
        if e.response['Error']['Code'] == 'NoSuchKey':
            print("No kendra policy file found, skipping")
        else:
            print(
                "ClientError exception from s3helper.readFromS3() for policy file: " + str(e))

    # an error that should be investigated
    except Exception as e:
        policyData = None
        print("Unspecified exception from s3helper.readFromS3() for policy file: " + str(e))

    # generate UUID for document
    documentId = generateDocumentID(os.environ['DOCUMENTS_BUCKET'], s3Client)

    # upload document in document bucket
    destinationDocumentKey = "public/" + documentId + "/" + ingestionDocumentFilename

    ret = uploadDocument(os.environ['DOCUMENTS_BUCKET'],
                         destinationDocumentKey,
                         ingestionDocumentFilename,
                         s3Client)

    # in case of error uploading document, we exit
    if ret == False:
        print("Failed to upload document into output bucket: " +
              destinationDocumentKey)
        return

    # if optional Kendra policy was present, upload it to document folder
    # alongside document
    if policyData != None:
        print("Copying over the kendra policy file for document " + documentId)
        s3helper.writeToS3(policyData,
                           os.environ['DOCUMENTS_BUCKET'],
                           "public/" + documentId + "/" + policyFilename,
                           awsRegion=os.environ['AWS_REGION'])

    # start normal document processing by creating a DynamoDB record,
    # another lambda function will pick it up from a DynamoDB stream
    # event
    docStore = DocumentStore(os.environ['DOCUMENTS_TABLE'],
                             os.environ['OUTPUT_TABLE'])

    docStore.createDocument(documentId,
                            os.environ['DOCUMENTS_BUCKET'],
                            destinationDocumentKey)

    return


def processQueueRecord(queueRecord):

    records = json.loads(queueRecord['body'])

    # one of more s3 event records
    if 'Records' in records:
        for record in records['Records']:
            try:
                if record['eventSource'] == 'aws:s3':
                    if record['eventName'] == 'ObjectCreated:Put' or record['eventName'] == 'ObjectCreated:Copy':
                        processDocument(record)
            except Exception as e:
                print("Failed to process s3 record. Exception: {}".format(e))


def lambda_handler(event, context):

    print("Event: {}".format(event))

    if 'Records' in event:
        for queueRecord in event['Records']:
            try:
                processQueueRecord(queueRecord)
            except Exception as e:
                print("Failed to process queue record. Exception: {}".format(e))

