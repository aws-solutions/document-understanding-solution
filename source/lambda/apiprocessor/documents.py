
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

def scanDocuments(table, pageSize, nextToken=None):
    if(nextToken is not None):
        return table.scan(
            Limit=pageSize,
            ExclusiveStartKey={"documentId": nextToken}
        )

    return table.scan(
        Limit=pageSize,
    )

def scanDocumentTotals(table, nextToken=None):
    if(nextToken is not None):
        return table.scan(
            Select="COUNT",
            ExclusiveStartKey={"documentId": nextToken}
        )

    return table.scan(
        Select="COUNT",
    )

def paginateDocuments(table, pageSize, nextToken=None):
    scanning = True
    documents = []
    total = 0
    nextCountToken = None

    while(scanning is True):
        response = scanDocumentTotals(table, nextCountToken)
        total += response["Count"]
        if("LastEvaluatedKey" in response):
            nextCountToken = response["LastEvaluatedKey"]["documentId"]
        else:
           scanning = False

    scanning = True

    while(scanning is True):
        limit = pageSize - len(documents)
        response = scanDocuments(table, limit, nextToken)
        if("Items" in response):
            documents = documents + response["Items"]
            if(len(documents) == pageSize):
                scanning = False
        if("LastEvaluatedKey" in response):
            nextToken = response["LastEvaluatedKey"]["documentId"]
        else:
            scanning = False
            nextToken = None
        if(len(documents) == total):
            scanning = False
            nextToken = None

    out = {
        "documents": documents,
        "Total": total
    }

    if(nextToken is not None):
        out["nextToken"] = nextToken

    return out


def getDocuments(request):

    pageSize = 25
    documentsTable = request["documentsTable"] if "documentsTable" in request else None
    response = {}

    if(documentsTable is not None):
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(documentsTable)
        nextToken = request["nextToken"] if "nextToken" in request else None

        response = paginateDocuments(table, pageSize, nextToken)
        if("Items" in response):
            print("Total items in  response {}".format(len(response["Items"])))

    return response
