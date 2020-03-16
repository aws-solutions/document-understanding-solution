import json
import os
import boto3
import time
from helper import AwsHelper
from og import OutputGenerator
import datastore
from comprehendHelper import ComprehendHelper

DOCTEXT = "docText"
KVPAIRS = "KVPairs"

def generatePdf(documentId, bucketName, objectName, responseBucketName):
    
    outputPath = "{}-analysis/{}/".format(objectName, documentId)
    responseDocumentName = "{}response.json".format(outputPath)
    outputDocumentName = "{}searchable-pdf.pdf".format(outputPath)

    data = {}
    data["bucketName"] = bucketName
    data["documentName"] = objectName
    data["responseBucketName"] = responseBucketName
    data["responseDocumentName"] = responseDocumentName
    data["outputBucketName"] = responseBucketName
    data["outputDocumentName"] = outputDocumentName

    client = boto3.client('lambda')

    response = client.invoke(
    FunctionName=os.environ['PDF_LAMBDA'],
    InvocationType='RequestResponse',
    LogType='Tail',
    Payload=json.dumps(data)
    )
    
    print(response["Payload"].read())

def getJobResults(api, jobId):

    pages = []

    client = AwsHelper().getClient('textract')
    if(api == "StartDocumentTextDetection"):
        response = client.get_document_text_detection(JobId=jobId)
    else:
        response = client.get_document_analysis(JobId=jobId)
    pages.append(response)
    print("Resultset page recieved: {}".format(len(pages)))
    nextToken = None
    if('NextToken' in response):
        nextToken = response['NextToken']
        print("Next token: {}".format(nextToken))

    while(nextToken):
        try:
            if(api == "StartDocumentTextDetection"):
                response = client.get_document_text_detection(JobId=jobId, NextToken=nextToken)
            else:
                response = client.get_document_analysis(JobId=jobId, NextToken=nextToken)

            pages.append(response)
            print("Resultset page recieved: {}".format(len(pages)))
            nextToken = None
            if('NextToken' in response):
                nextToken = response['NextToken']
                print("Next token: {}".format(nextToken))

        except Exception as e:
            if(e.__class__.__name__ == 'ProvisionedThroughputExceededException'):
                print("ProvisionedThroughputExceededException.")
                print("Waiting for few seconds...")
                time.sleep(5)
                print("Waking up...")


    return pages

def processRequest(request):

    output = ""

    print(request)

    jobId = request['jobId']
    jobTag = request['jobTag']
    jobStatus = request['jobStatus']
    jobAPI = request['jobAPI']
    bucketName = request['bucketName']
    outputBucketName = request['outputBucketName']
    objectName = request['objectName']
    outputTable = request["outputTable"]
    documentsTable = request["documentsTable"]
    elasticsearchDomain = request["elasticsearchDomain"]

    pages = getJobResults(jobAPI, jobId)

    print("Result pages recieved: {}".format(len(pages)))

    dynamodb = AwsHelper().getResource("dynamodb")
    ddb = dynamodb.Table(outputTable)

    detectForms = False
    detectTables = False
    if(jobAPI == "StartDocumentAnalysis"):
        detectForms = True
        detectTables = True

    dynamodb = AwsHelper().getResource('dynamodb')
    ddb = dynamodb.Table(outputTable)

    opg = OutputGenerator(jobTag, pages, outputBucketName, objectName, detectForms, detectTables, ddb, elasticsearchDomain)
    opg_output = opg.run()

    generatePdf(jobTag, bucketName, objectName, outputBucketName)

    # generate Comprehend and ComprehendMedical entities
    path = objectName + "-analysis" + "/"+ jobTag + "/"
    print("path: " +  path)
    maxPages = 100
    comprehendClient = ComprehendHelper()
    comprehendAndMedicalEntities = comprehendClient.processComprehend(outputBucketName, 'response.json', path, maxPages)

    print("DocumentId: {}".format(jobTag))
    print("Processed Comprehend Data: {}".format(comprehendAndMedicalEntities))

    # index document once the comprehend entities and KVPairs have been extracted
    for key, val in opg_output[KVPAIRS].items():
        if key not in comprehendAndMedicalEntities:
            comprehendAndMedicalEntities[key] = val
        else:
            comprehendAndMedicalEntities[key].add(val)
    opg.indexDocument(opg_output[DOCTEXT], comprehendAndMedicalEntities)

    ds = datastore.DocumentStore(documentsTable, outputTable)
    ds.markDocumentComplete(jobTag)

    output = "Processed -> Document: {}, Object: {}/{} processed.".format(jobTag, bucketName, objectName)

    print(output)

    return {
        'statusCode': 200,
        'body': output
    }

def lambda_handler(event, context):

    print("event: {}".format(event))

    body = json.loads(event['Records'][0]['body'])
    message = json.loads(body['Message'])

    print("Message: {}".format(message))

    request = {}

    request["jobId"] = message['JobId']
    request["jobTag"] = message['JobTag']
    request["jobStatus"] = message['Status']
    request["jobAPI"] = message['API']
    request["bucketName"] = message['DocumentLocation']['S3Bucket']
    request["objectName"] = message['DocumentLocation']['S3ObjectName']
    request["outputBucketName"] = os.environ['OUTPUT_BUCKET']
    request["elasticsearchDomain"] = os.environ['ES_DOMAIN']
    request["outputTable"] = os.environ['OUTPUT_TABLE']
    request["documentsTable"] = os.environ['DOCUMENTS_TABLE']

    return processRequest(request)

def lambda_handler_local(event, context):
    print("event: {}".format(event))
    return processRequest(event)
