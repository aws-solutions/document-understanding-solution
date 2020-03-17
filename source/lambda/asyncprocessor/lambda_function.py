import json
import boto3
import os
from helper import AwsHelper
import time

def startJob(bucketName, objectName, documentId, snsTopic, snsRole, detectForms, detectTables):

    print("Starting job with documentId: {}, bucketName: {}, objectName: {}".format(documentId, bucketName, objectName))

    response = None
    client = AwsHelper().getClient('textract')
    if(not detectForms and not detectTables):
        response = client.start_document_text_detection(
            ClientRequestToken  = documentId,
            DocumentLocation={
                'S3Object': {
                    'Bucket': bucketName,
                    'Name': objectName
                }
            },
            NotificationChannel= {
              "RoleArn": snsRole,
              "SNSTopicArn": snsTopic
           },
           JobTag = documentId)
    else:
        features  = []
        if(detectTables):
            features.append("TABLES")
        if(detectForms):
            features.append("FORMS")

        response = client.start_document_analysis(
            ClientRequestToken  = documentId,
            DocumentLocation={
                'S3Object': {
                    'Bucket': bucketName,
                    'Name': objectName
                }
            },
            FeatureTypes=features,
            NotificationChannel= {
                  "RoleArn": snsRole,
                  "SNSTopicArn": snsTopic
               },
            JobTag = documentId)

    return response["JobId"]

def processRequest(request):

    output = ""

    print("request: {}".format(request))
    
    bucketName = request['bucketName']
    objectName = request['objectName']
    features = request['features']
    documentId = request['documentId']
    snsTopic = request['snsTopic']
    snsRole = request['snsRole']

    detectForms = 'Forms' in features
    detectTables = 'Tables' in features

    jobId = startJob(bucketName, objectName, documentId, snsTopic, snsRole, detectForms, detectTables)

    if(jobId):
        output = "Started Job with Id: {}".format(jobId)

    print(output)

    return {
        'statusCode': 200,
        'body': output
    }

def lambda_handler(event, context):

    print("event: {}".format(event))
    
    message = json.loads(event['Records'][0]['body'])
    
    print("Message: {}".format(message))

    request = {}
    request["documentId"] = message['documentId']
    request["bucketName"] = message['bucketName']
    request["objectName"] = message['objectName']
    request["features"] = message['features']
    request["snsTopic"] = os.environ['SNS_TOPIC_ARN']
    request["snsRole"] = os.environ['SNS_ROLE_ARN']

    return processRequest(request)