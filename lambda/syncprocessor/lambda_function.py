import boto3
from decimal import Decimal
import json
import os
from helper import AwsHelper, S3Helper, DynamoDBHelper
from og import OutputGenerator
import datastore
from comprehendHelper import ComprehendHelper

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


def callTextract(bucketName, objectName, detectText, detectForms, detectTables):
    textract = AwsHelper().getClient('textract')
    if(not detectForms and not detectTables):
        response = textract.detect_document_text(
            Document={
                'S3Object': {
                    'Bucket': bucketName,
                    'Name': objectName
                }
            }
        )
    else:
        features  = []
        if(detectTables):
            features.append("TABLES")
        if(detectForms):
            features.append("FORMS")

        response = textract.analyze_document(
            Document={
                'S3Object': {
                    'Bucket': bucketName,
                    'Name': objectName
                }
            },
            FeatureTypes=features
        )

    return response


def processImage(documentId, features, bucketName, outputBucketName, objectName, outputTableName, documentsTableName, elasticsearchDomain):

    detectText = "Text" in features
    detectForms = "Forms" in features
    detectTables = "Tables" in features

    response = callTextract(bucketName, objectName, detectText, detectForms, detectTables)

    dynamodb = AwsHelper().getResource("dynamodb")
    ddb = dynamodb.Table(outputTableName)

    print("Generating output for DocumentId: {}".format(documentId))

    opg = OutputGenerator(documentId, response, outputBucketName, objectName, detectForms, detectTables, ddb, elasticsearchDomain)
    docText = opg.run()

    generatePdf(documentId, bucketName, objectName, outputBucketName)
   
    # generate Comprehend and ComprehendMedical entities in S3
    path = objectName + "-analysis" + "/"+ documentId + "/"
    print("path: " +  path)
    maxPages = 100
    comprehendClient = ComprehendHelper()
    processedComprehendData = comprehendClient.processComprehend(outputBucketName, 'response.json', path, maxPages)

    print("DocumentId: {}".format(documentId))
    print("Processed Comprehend data: {}".format(processedComprehendData))

    opg.indexDocument(docText,processedComprehendData)

    ds = datastore.DocumentStore(documentsTableName, outputTableName)
    ds.markDocumentComplete(documentId)

# --------------- Main handler ------------------

def processRequest(request):

    output = ""

    print("request: {}".format(request))

    bucketName = request['bucketName']
    objectName = request['objectName']
    features = request['features']
    documentId = request['documentId']
    outputBucketName = request['outputBucketName']
    outputTable = request['outputTable']
    documentsTable = request['documentsTable']
    documentsTable = request["documentsTable"]
    elasticsearchDomain = request["elasticsearchDomain"]

    if(documentId and bucketName and objectName and features):
        print("DocumentId: {}, features: {}, Object: {}/{}".format(documentId, features, bucketName, objectName))

        processImage(documentId, features, bucketName, outputBucketName, objectName, outputTable, documentsTable, elasticsearchDomain)

        output = "Document: {}, features: {}, Object: {}/{} processed.".format(documentId, features, bucketName, objectName)
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
    request["outputBucketName"] = os.environ['OUTPUT_BUCKET']
    request["outputTable"] = os.environ['OUTPUT_TABLE']
    request["documentsTable"] = os.environ['DOCUMENTS_TABLE']
    request["elasticsearchDomain"] = os.environ['ES_DOMAIN']
    return processRequest(request)
