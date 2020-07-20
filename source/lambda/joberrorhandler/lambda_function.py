
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
        document_id = json.loads(record['body'])['documentId']
        print("Processing doc : {}".format(document_id))
        if get_document_status(document_id) != 'SUCCEEDED':
            print("Updating status for doc : {}".format(document_id))
            update_document_status_to_failed(document_id)
    