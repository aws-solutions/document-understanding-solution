import boto3
from decimal import Decimal
import json
import os
from helper import AwsHelper, S3Helper, DynamoDBHelper
from og import OutputGenerator, KVPAIRS, DOCTEXT ,SERVICE_OUTPUT_PATH_S3_PREFIX,COMPREHEND_PATH_S3_PREFIX,TEXTRACT_PATH_S3_PREFIX,PUBLIC_PATH_S3_PREFIX
import datastore
from comprehendHelper import ComprehendHelper

def generatePdf(documentId, bucketName, objectName, responseBucketName, outputPath):

    responseDocumentName = "{}{}response.json".format(outputPath,TEXTRACT_PATH_S3_PREFIX)
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
        features = []
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

    response = callTextract(bucketName, objectName,
                            detectText, detectForms, detectTables)

    dynamodb = AwsHelper().getResource("dynamodb")
    ddb = dynamodb.Table(outputTableName)

    
    outputPath = '{}{}/{}'.format(PUBLIC_PATH_S3_PREFIX,documentId,SERVICE_OUTPUT_PATH_S3_PREFIX)
    print("Generating output for DocumentId: {} and storing in {}".format(documentId,outputPath))

    opg = OutputGenerator(documentId, response, outputBucketName, objectName, detectForms, detectTables, ddb,outputPath, elasticsearchDomain)
    opg_output = opg.run()

    generatePdf(documentId, bucketName, objectName, outputBucketName,outputPath)

    # generate Comprehend and ComprehendMedical entities in S3
    comprehendOutputPath = "{}{}".format(outputPath,COMPREHEND_PATH_S3_PREFIX)
    print("Comprehend output path: " + comprehendOutputPath)
    maxPages = 100
    comprehendClient = ComprehendHelper()
    responseDocumentName = "{}{}response.json".format(outputPath,TEXTRACT_PATH_S3_PREFIX)
    comprehendAndMedicalEntities = comprehendClient.processComprehend(outputBucketName, responseDocumentName, comprehendOutputPath, maxPages)

    print("DocumentId: {}".format(documentId))
    print("Processed Comprehend data: {}".format(comprehendAndMedicalEntities))

    for key, val in opg_output[KVPAIRS].items():
        if key not in comprehendAndMedicalEntities:
            comprehendAndMedicalEntities[key] = val
        else:
            comprehendAndMedicalEntities[key].add(val)
    opg.indexDocument(opg_output[DOCTEXT], comprehendAndMedicalEntities)

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
        print("DocumentId: {}, features: {}, Object: {}/{}".format(documentId,
                                                                   features, bucketName, objectName))

        processImage(documentId, features, bucketName, outputBucketName,
                     objectName, outputTable, documentsTable, elasticsearchDomain)

        output = "Document: {}, features: {}, Object: {}/{} processed.".format(
            documentId, features, bucketName, objectName)
    
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
