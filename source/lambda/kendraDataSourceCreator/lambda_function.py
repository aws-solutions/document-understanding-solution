import boto3
import os

def on_create(event, context):
    print("creating an s3 data source and connector for the Covid dataset")
    kendra_client = boto3.client('kendra')
    kendraIndexId = os.environ['KENDRA_INDEX_ID']
    print(kendraIndexId)
    dataBucketName = os.environ['DATA_BUCKET_NAME']
    roleArn = os.environ['KENDRA_ROLE_ARN']

    create_data_source_response = kendra_client.create_data_source(
        Name='CovidDataset',
        IndexId= kendraIndexId,
        Type='S3',
        Configuration={
            'S3Configuration': {
                'BucketName': dataBucketName,
            }
        },
        Description='Covid pdfs data',
        RoleArn=roleArn
    )
    dataSourceId = create_data_source_response['Id']
    print(create_data_source_response)
    print("synching the s3 data source")
    response = kendra_client.start_data_source_sync_job(
        Id=dataSourceId,
        IndexId=kendraIndexId
    )
    print(response)
    return {'PhysicalResourceId' : dataSourceId}
   
def on_update(event, context):
    print("Cannot update KMS key for Kendra Index. Please delete the index and try again.")

def lambda_handler(event, context):
    print("event: {}".format(event))
    request_type = event['RequestType']
    if(request_type == 'Create'): return on_create(event, context)
    if(request_type == 'Update'): return on_update(event, context)