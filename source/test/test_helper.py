import sys
sys.path.append("./lambda/helper/python")
import boto3
import unittest
from moto import mock_s3
from moto import mock_dynamodb2
from helper import S3Helper
from helper import DynamoDBHelper

BUCKET_NAME = "test-bucket"
S3_FILE_NAME = "test_file_name.txt"
TABLE_NAME = "TestsTable"

current_session = boto3.session.Session()
REGION = current_session.region_name
print(f"Test region is {REGION}")

@mock_s3
class TestS3Helper(unittest.TestCase):
    def setUp(self):
        self.conn = boto3.resource('s3', region_name=REGION)
        # according to the documentation https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html#S3.ServiceResource.create_bucket
        # buckets in region us-east-1 do not require the region to be specified and have a location constraint of null
        if(REGION=='us-east-1'):
            self.conn.create_bucket(Bucket=BUCKET_NAME)
        else:
            self.conn.create_bucket(Bucket=BUCKET_NAME, CreateBucketConfiguration={'LocationConstraint': REGION})

    def test_get_s3_bucket_region(self):
        bucketRegion = S3Helper.getS3BucketRegion(BUCKET_NAME)
        if(REGION=='us-east-1'):
            self.assertEqual(bucketRegion, None)
        else:
            self.assertEqual(bucketRegion,REGION)
    
    def test_write_to_s3(self):
        S3Helper.writeToS3("Hello World", BUCKET_NAME, S3_FILE_NAME, REGION)
        body = self.conn.Object(BUCKET_NAME, S3_FILE_NAME).get()['Body'].read().decode('utf-8')
        self.assertEqual(body, "Hello World")
    
    def test_read_from_s3(self):
        self.conn.Object(BUCKET_NAME, S3_FILE_NAME).put(Body="Test")
        body = S3Helper.readFromS3(BUCKET_NAME, S3_FILE_NAME, REGION)
        self.assertEqual(body,"Test")
    
    def tearDown(self):
        buckets = boto3.client('s3').list_buckets()
        for bucket in buckets['Buckets']:
            s3_bucket = self.conn.Bucket(bucket['Name'])
            s3_bucket.objects.all().delete()
            s3_bucket.delete()

@mock_dynamodb2
class TestDynamoDBHelper(unittest.TestCase):
    def setUp(self):
        self.conn = boto3.client('dynamodb',region_name=REGION)
        self.conn.create_table(
            TableName = TABLE_NAME,
            KeySchema = [{"AttributeName": "forum_name","KeyType":"HASH"}],
            AttributeDefinitions=[{"AttributeName": "forum_name", "AttributeType": "S"}],
            ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        )
        self.conn.put_item(
            TableName = TABLE_NAME,
            Item={
                "forum_name": {"S" : "Test"},
                "subject": {"S" : "test subject"}
            }
        )

    def test_get_items(self):
        items = DynamoDBHelper.getItems(TABLE_NAME, "forum_name", "Test")
        expected_result = [{'forum_name': 'Test', 'subject': 'test subject'}]
        self.assertEqual(items, expected_result)
    
    def test_insert_item(self):
        new_item = {
                "forum_name": "Test2",
                "subject": "test subject2"
            }
        ddbResponse = DynamoDBHelper.insertItem(TABLE_NAME, new_item)
        self.assertEqual(ddbResponse['ResponseMetadata']['HTTPStatusCode'],200)
    
    def tearDown(self):
        self.conn.delete_table(TableName=TABLE_NAME)

if __name__=='__main__':
    unittest.main()
