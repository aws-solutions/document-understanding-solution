import os
import json
import boto3

TABLE_NAME =os.environ['DOCUMENTS_TABLE']
dynamodb_client = boto3.client('dynamodb')
    

def get_document_status(document_id):
    response = dynamodb_client.get_item(TableName=TABLE_NAME,Key={'documentId':{'S':str(document_id)}})
    if response.get('Item') is not None:
        if response['Item'].get('documentStatus') is not None:
            return response['Item']['documentStatus'].get('S')
    
def update_document_status_to_failed(document_id):
    dynamodb_client.update_item(
    TableName=TABLE_NAME,
    Key={'documentId': {'S': document_id}},
    UpdateExpression="set documentStatus = :r",
    ExpressionAttributeValues={':r': {'S':'FAILED'}}
    )
    
def lambda_handler(event, context):
    for record in event['Records']:
        document_id = record['body']['documentId']
        if get_document_status(document_id) != 'SUCCEEDED':
            update_document_status_to_failed(document_id)
    