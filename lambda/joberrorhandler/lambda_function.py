import os
import json
import boto3

TABLE_NAME =os.environ['DOCUMENTS_TABLE']

def get_document_status(document_id):
    d_client = boto3.client('dynamodb')
    d_resposne = d_client.get_item(TableName=TABLE_NAME,Key={'documentId':{'S':str(document_id)}})
    if d_resposne.get('Item') is not None:
        if d_resposne['Item'].get('documentStatus') is not None:
            return d_resposne['Item']['documentStatus'].get('S')
    
def update_document_status_to_failed(document_id):
    d_client = boto3.client('dynamodb')
    d_client.update_item(
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
    