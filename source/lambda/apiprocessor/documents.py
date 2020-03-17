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
            print(len(response["Items"]))

    return response
