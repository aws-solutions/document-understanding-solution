import sys
sys.path.append("./lambda/helper/python")
import boto3
import unittest
from moto import mock_s3
from moto import mock_dynamodb2
import datastore

DOCUMENTS_TABLE_NAME="DocumentsTestTable"
OUTPUT_TABLE_NAME="OutputTestTable"

current_session = boto3.session.Session()
REGION = current_session.region_name
print(f"Test region is {REGION}")

@mock_dynamodb2
class TestDocumentStore(unittest.TestCase):
    def setUp(self):
        self.conn = boto3.client('dynamodb',region_name=REGION)
        self.conn.create_table(
            TableName = DOCUMENTS_TABLE_NAME,
            KeySchema = [{"AttributeName": "documentId","KeyType":"HASH"}],
            AttributeDefinitions=[{"AttributeName": "documentId", "AttributeType": "S"}],
            ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        )
        self.conn.put_item(
            TableName = DOCUMENTS_TABLE_NAME,
            Item={
                "documentId": {"S" : "b1a54fda-1809-49d7-8f19-0d1688eb65b9"},
                "objectName": {"S": "public/samples/Misc/expense.png"},
                "bucketName": {"S": "dusstack-sample-s3-bucket"},
                "documentStatus": {"S": "IN_PROGRESS"},
                "documentPipesRequests": {"L": [{"S": "textract"} ]},
                "documentPipesFinished": {"L": [{"S": "none"}]}
            }
        )
        self.conn.put_item(
            TableName = DOCUMENTS_TABLE_NAME,
            Item={
                "documentId": {"S" : "b1a99fda-1809-49d7-8f19-0d1688eb65b9"},
                "objectName": {"S": "public/samples/Misc/expense.png"},
                "bucketName": {"S": "dusstack-sample-s3-bucket"},
                "documentStatus": {"S": "IN_PROGRESS"},
                "documentPipesRequests": {"L": [{"S": "textract"}]},
                "documentPipesFinished": {"L": [{"S": "none"}]}
            }
        )
        self.ds = datastore.DocumentStore(DOCUMENTS_TABLE_NAME,OUTPUT_TABLE_NAME)
    
    def test_create_document_success(self):
        bucketName = "dusstack-sample-s3-bucket"
        objectName = "public/samples/Finance/report.pdf"
        documentId = "b1a66fda-1809-49d7-8f19-0d1688eb65b9"
        response = self.ds.createDocument(documentId, bucketName, objectName)
        self.assertEqual(response, None)
    
    def test_create_duplicate_document_id_throws_error(self):
        bucketName = "dusstack-sample-s3-bucket"
        objectName = "public/samples/Finance/report.pdf"
        documentId = "b1a54fda-1809-49d7-8f19-0d1688eb65b9"
        response = self.ds.createDocument(documentId, bucketName, objectName)
        self.assertEqual(response, {'Error': 'Document already exist.'})
    
    def test_update_document_status_success(self):
        documentId = "b1a54fda-1809-49d7-8f19-0d1688eb65b9"
        response = self.ds.updateDocumentStatus(documentId, "FAILED")
        self.assertEqual(response, None)
    
    def test_update_document_status_throws_error_when_document_does_not_exist(self):
        documentId = "b1333fda-1809-49d7-8f19-0d1688eb65b9"
        response = self.ds.updateDocumentStatus(documentId, "FAILED")
        self.assertEqual(response, {'Error': 'Document does not exist.'})

    def test_mark_document_complete_success(self):
        documentId = "b1a54fda-1809-49d7-8f19-0d1688eb65b9"
        res = self.ds.updateDocumentPipesFinished(documentId,["textract"])
        response = self.ds.markDocumentComplete(documentId)
        documentStatus = self.conn.get_item(
            Key={'documentId': {'S': documentId}},
            TableName=DOCUMENTS_TABLE_NAME
        )['Item']['documentStatus']['S']
        self.assertEqual(documentStatus, "SUCCEEDED")
        self.assertEqual(response, None)
    
    def test_delete_document_success(self):
        documentId = "b1a54fda-1809-49d7-8f19-0d1688eb65b9"
        self.ds.deleteDocument(documentId)
        response = self.conn.get_item(
            Key={'documentId': {'S': documentId}},
            TableName=DOCUMENTS_TABLE_NAME
        )
        self.assertTrue('Item' not in response)
    
    def test_get_documents(self):
        response = self.ds.getDocuments()
        self.assertEqual(len(response['documents']),2)
        document_ids = []
        for document in response['documents']:
            document_ids.append(document['documentId'])
        self.assertTrue('b1a54fda-1809-49d7-8f19-0d1688eb65b9' in document_ids)
        self.assertTrue('b1a99fda-1809-49d7-8f19-0d1688eb65b9' in document_ids)

    
    def test_get_document_count(self):
        response = self.ds.getDocumentCount()
        self.assertEqual(response, 2)
    
    def test_get_table(self):
        response = self.ds.getTable()
        self.assertEqual(response.name,DOCUMENTS_TABLE_NAME)
        self.assertTrue("dynamodb.Table" in response.__class__.__name__)
    
    def test_get_document(self):
        documentId = 'b1a99fda-1809-49d7-8f19-0d1688eb65b9'
        response = self.ds.getDocument(documentId)
        self.assertEqual(response['documentStatus'], 'IN_PROGRESS')
        self.assertEqual(response['documentId'], documentId)
        self.assertEqual(response['bucketName'], "dusstack-sample-s3-bucket")

    def tearDown(self):
        self.conn.delete_table(TableName=DOCUMENTS_TABLE_NAME)


if __name__=='__main__':
    unittest.main()