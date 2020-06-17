import os
import json

from documents import getDocuments
from document import getDocument, createDocument, deleteDocument
from redact import redact
from search import search, deleteESItem

def lambda_handler(event, context):

    print("event: {}".format(event))

    result = {}

    documentBucket = os.environ['CONTENT_BUCKET']
    sampleBucket = os.environ['SAMPLE_BUCKET']

    if('resource' in event):
        request = {}
        request["elasticsearchDomain"] = os.environ['ES_DOMAIN']
        request["outputTable"] = os.environ['OUTPUT_TABLE']
        request["documentsTable"] = os.environ['DOCUMENTS_TABLE']

        # search Elasticsearch handler
        if(event['resource'] == '/search'):
            if('queryStringParameters' in event and 'k' in event['queryStringParameters']):
                request["keyword"] = event['queryStringParameters']['k']
                if('documentId' in event['queryStringParameters']):
                    request["documentId"] = event['queryStringParameters']['documentId']
                result = search(request)
    
        elif(event['resource'] == '/documents'):
            if('queryStringParameters' in event and event['queryStringParameters'] and 'nexttoken' in event['queryStringParameters']):
                request["nextToken"] = event['queryStringParameters']['nexttoken']
            if('queryStringParameters' in event and event['queryStringParameters'] and 'type' in event['queryStringParameters']):
                request["type"] = event['queryStringParameters']['type']
            result = getDocuments(request)
        elif(event['resource'] == '/document'):
            if(event['httpMethod'] == 'GET'):
                if('queryStringParameters' in event and event['queryStringParameters']):
                    if('documentid' in event['queryStringParameters']):
                        request["documentId"] = event['queryStringParameters']['documentid']
                        result = getDocument(request)
                    elif('bucketname' in event['queryStringParameters'] and 'objectname' in event['queryStringParameters']):
                        request["bucketName"] = event['queryStringParameters']['bucketname']
                        request["objectName"] = event['queryStringParameters']['objectname']
                        result = createDocument(request)
            elif(event['httpMethod'] == 'POST'):
                body = json.loads(event['body'])
                if('objects' in body):
                    results = []
                    for obj in body['objects']:
                        request["bucketName"] = sampleBucket if obj['sample'] else documentBucket
                        request["objectName"] = obj['key']
                        results.append(createDocument(request))
                    result = results
                else:
                    request["bucketName"] = sampleBucket if body['sample'] else documentBucket
                    request["objectName"] = body['key']
                    result = createDocument(request)
            elif(event['httpMethod'] == 'DELETE'):
                if('documentid' in event['queryStringParameters']):
                    request["documentId"] = event['queryStringParameters']['documentid']
                    result = deleteDocument(request)
                    deleteESItem(request["elasticsearchDomain"], request["documentId"])
                        
        elif(event['resource'] == '/redact'):
            params = event['queryStringParameters'] if 'queryStringParameters' in event else {}
            request["params"] = params
            result = redact(request)

    return {
        "isBase64Encoded": False,
        "statusCode": 200,
        'body': json.dumps(result),
        "headers": {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            }
        }
