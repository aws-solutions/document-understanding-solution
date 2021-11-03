
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
from helper import AwsHelper
import datetime
import re


def getDataFromPath(str):
    response = {
        "type": "user"
    }
    nodes = list(filter(lambda x: x != '', re.findall(r"\w*?(?=/)", str)))

    return response


class DocumentStore:

    def __init__(self, documentsTableName, outputTableName):
        self._documentsTableName = documentsTableName
        self._outputTableName = outputTableName

    def createDocument(self, documentId, bucketName, objectName, documentPipesRequests = ["textract"] ):

        err = None

        dynamodb = AwsHelper().getResource("dynamodb")
        table = dynamodb.Table(self._documentsTableName)

        dataFromPath = getDataFromPath(objectName)
        try:
            table.update_item(
                Key={"documentId": documentId},
                UpdateExpression='SET bucketName = :bucketNameValue, objectName = :objectNameValue, documentStatus = :documentstatusValue, documentCreatedOn = :documentCreatedOnValue, documentPipesRequests = :documentPipesRequestsValue, documentPipesFinished = :documentPipesFinishedValue',
                ConditionExpression='attribute_not_exists(documentId)',
                ExpressionAttributeValues={
                    ':bucketNameValue': bucketName,
                    ':objectNameValue': objectName,
                    ':documentstatusValue': 'IN_PROGRESS',
                    ':documentCreatedOnValue': str(datetime.datetime.utcnow()),
                    ':documentPipesRequestsValue': documentPipesRequests,
                    ':documentPipesFinishedValue' : ["none"],
                }
            )
        except ClientError as e:
            print("Error : {}".format(e))
            if e.response['Error']['Code'] == "ConditionalCheckFailedException":
                print(e.response['Error']['Message'])
                err = {'Error': 'Document already exist.'}
            else:
                raise

        return err

    def updateDocumentStatus(self, documentId, documentStatus):

        err = None

        dynamodb = AwsHelper().getResource("dynamodb")
        table = dynamodb.Table(self._documentsTableName)

        try:
            table.update_item(
                Key={'documentId': documentId},
                UpdateExpression='SET documentStatus= :documentstatusValue',
                ConditionExpression='attribute_exists(documentId)',
                ExpressionAttributeValues={
                    ':documentstatusValue': documentStatus
                }
            )
        except ClientError as e:
            if e.response['Error']['Code'] == "ConditionalCheckFailedException":
                print(e.response['Error']['Message'])
                err = {'Error': 'Document does not exist.'}
            else:
                raise

        return err

    def updateDocumentPipesRequest(self, documentId, pipesRequest):

        err = None

        dynamodb = AwsHelper().getResource("dynamodb")
        table = dynamodb.Table(self._documentsTableName)

        try:
            table.update_item(
                Key={'documentId': documentId},
                UpdateExpression='SET documentPipesRequests= :documentPipesRequestsValue',
                ConditionExpression='attribute_exists(documentId)',
                ExpressionAttributeValues={
                    ':documentPipesRequestsValue': set(pipesRequest)
                }
            )
        except ClientError as e:
            if e.response['Error']['Code'] == "ConditionalCheckFailedException":
                print(e.response['Error']['Message'])
                err = {'Error': 'Document does not exist.'}
            else:
                raise

        return err

    def updateDocumentPipesFinished(self, documentId, pipesJustFinished):

        err = None

        dynamodb = AwsHelper().getResource("dynamodb")
        table = dynamodb.Table(self._documentsTableName)
        doc_items = self.getDocument(documentId)
        pipesFinished = doc_items["documentPipesFinished"]
        pipesFinished = list(set(pipesFinished + pipesJustFinished))

        try:
            table.update_item(
                Key={'documentId': documentId},
                UpdateExpression='SET documentPipesFinished= :documentPipesFinishedValue',
                ConditionExpression='attribute_exists(documentId)',
                ExpressionAttributeValues={
                    ':documentPipesFinishedValue': pipesFinished
                }
            )
        except ClientError as e:
            if e.response['Error']['Code'] == "ConditionalCheckFailedException":
                print(e.response['Error']['Message'])
                err = {'Error': 'Document does not exist.'}
            else:
                raise

        return err

    def markDocumentComplete(self, documentId):

        err = None

        dynamodb = AwsHelper().getResource("dynamodb")
        table = dynamodb.Table(self._documentsTableName)

        doc_items = self.getDocument(documentId)
        pipesRequests = doc_items["documentPipesRequests"]
        pipesFinished = doc_items["documentPipesFinished"]

        remainingPipes = list(set(pipesRequests)-set(pipesFinished))

        if len(remainingPipes)>0:
            print(f"Document {documentId} not completed, remaining pipes {remainingPipes}")
            return err

        try:
            table.update_item(
                Key={'documentId': documentId},
                UpdateExpression='SET documentStatus= :documentstatusValue, documentCompletedOn = :documentCompletedOnValue',
                ConditionExpression='attribute_exists(documentId)',
                ExpressionAttributeValues={
                    ':documentstatusValue': "SUCCEEDED",
                    ':documentCompletedOnValue': str(datetime.datetime.utcnow())
                }
            )
        except ClientError as e:
            if e.response['Error']['Code'] == "ConditionalCheckFailedException":
                print(e.response['Error']['Message'])
                err = {'Error': 'Document does not exist.'}
            else:
                raise

        return err

    def getDocument(self, documentId):

        dynamodb = AwsHelper().getClient("dynamodb")

        ddbGetItemResponse = dynamodb.get_item(
            Key={'documentId': {'S': documentId}},
            TableName=self._documentsTableName
        )

        itemToReturn = None

        if('Item' in ddbGetItemResponse):
            itemToReturn = {
                'documentId': ddbGetItemResponse['Item']['documentId']['S'],
                'bucketName': ddbGetItemResponse['Item']['bucketName']['S'],
                'objectName': ddbGetItemResponse['Item']['objectName']['S'],
                'documentStatus': ddbGetItemResponse['Item']['documentStatus']['S'],
                'documentPipesRequests': [item["S"] for item in ddbGetItemResponse['Item']['documentPipesRequests']['L']],
                'documentPipesFinished': [item["S"] for item in ddbGetItemResponse['Item']['documentPipesFinished']['L']],
            }

        return itemToReturn

    def deleteDocument(self, documentId):

        dynamodb = AwsHelper().getResource("dynamodb")
        table = dynamodb.Table(self._documentsTableName)

        table.delete_item(
            Key={
                'documentId': documentId
            }
        )

        # TODO this doesn't remove the document from Elasticsearch

    def getTable(self):

        dynamodb = AwsHelper().getResource("dynamodb")
        table = dynamodb.Table(self._documentsTableName)

        return table

    def getDocuments(self, nextToken=None):

        dynamodb = AwsHelper().getResource("dynamodb")
        table = dynamodb.Table(self._documentsTableName)

        pageSize = 25

        if(nextToken):
            response = table.scan(
                ExclusiveStartKey={"documentId": nextToken}, Limit=pageSize)
        else:
            response = table.scan(Limit=pageSize)

        print("response: {}".format(response))

        data = []

        if('Items' in response):
            data = response['Items']

        documents = {
            "documents": data
        }

        if 'LastEvaluatedKey' in response:
            nextToken = response['LastEvaluatedKey']['documentId']
            documents["nextToken"] = nextToken

        return documents

    def getDocumentCount(self):

        dynamodb = AwsHelper().getResource("dynamodb")

        table = dynamodb.Table(self._documentsTableName)

        return table.item_count
