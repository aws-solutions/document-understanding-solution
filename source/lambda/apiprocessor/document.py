import datastore
from helper import S3Helper
import json
import uuid


def createDocument(request):
    print("CreateDocument request: {}".format(request))

    documentsTable = request["documentsTable"]
    outputTable = request["outputTable"]
    bucketName = request["bucketName"]
    objectName = request["objectName"]
    ds = datastore.DocumentStore(documentsTable, outputTable)
    documentId = objectName.split('/')[1]
    ds.createDocument(documentId, bucketName, objectName)
    output = {
        "documentId": documentId
    }

    return output


def getDocument(request):
    print("GetDocument request: {}".format(request))

    documentsTable = request["documentsTable"]
    outputTable = request["outputTable"]
    documentId = request["documentId"]

    ds = datastore.DocumentStore(documentsTable, outputTable)
    doc = ds.getDocument(documentId)

    output = {}

    if(doc):
        output = doc

    return output


def deleteDocument(request):
    print("DeleteDocument request: {}".format(request))

    documentsTable = request["documentsTable"]
    outputTable = request["outputTable"]
    documentId = request["documentId"]

    ds = datastore.DocumentStore(documentsTable, outputTable)
    ds.deleteDocument(documentId)
