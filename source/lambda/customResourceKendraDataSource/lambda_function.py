import boto3
import os

def on_create(event, context):
    kendra_client = boto3.client('kendra')
    kendraIndexId = os.environ['KENDRA_INDEX_ID']
    print("creating an s3 data source and connector for kendra index id: {}".format(kendraIndexId))
    dataBucketName = os.environ['DATA_BUCKET_NAME']
    roleArn = os.environ['KENDRA_ROLE_ARN']

    create_faq_response = kendra_client.create_faq(
        IndexId=kendraIndexId,
        Name="DUSCovidFAQ",
        Description='covid-19 questions and answers',
        S3Path={
           'Bucket': dataBucketName,
           'Key': 'faqs/covid_faq.csv'
        },
        RoleArn=roleArn
    )
    
    print("covid FAQ created")
                                            
    create_data_source_response = kendra_client.create_data_source(
        Name='DUSCovidDataset',
        IndexId= kendraIndexId,
        Type='S3',
        Configuration={
            'S3Configuration': {
                'BucketName': dataBucketName,
                'InclusionPrefixes': [
                    'documents/'
                ]
            }
        },
        Description='Covid pdfs data',
        RoleArn=roleArn
    )
    dataSourceId = create_data_source_response['Id']
    print("Data source id {} for kendra index with id {} created.".format(dataSourceId, kendraIndexId))
    print("syncing the s3 data source")
    response = kendra_client.start_data_source_sync_job(
        Id=dataSourceId,
        IndexId=kendraIndexId
    )
    print("Started sync job for data source id :{}, the execution id of the sync job is :{}".format(dataSourceId,response['ExecutionId']))
    return {'PhysicalResourceId' : dataSourceId}
   
def on_update(event, context):
    kendra_client = boto3.client('kendra')
    kendraIndexId = os.environ['KENDRA_INDEX_ID']
    print("Updating the s3 data source and connector for kendra index id: {}".format(kendraIndexId))
    dataBucketName = os.environ['DATA_BUCKET_NAME']
    roleArn = os.environ['KENDRA_ROLE_ARN']
    dataSourceId = event['PhysicalResourceId']
    # Name of the data source cannot be updated. Hence we do not give the customers an option to do so.
    try:
        update_data_source_response = kendra_client.update_data_source(
            Id=dataSourceId,
            Name='DUSCovidDataset',
            IndexId= kendraIndexId,
            Configuration={
                'S3Configuration': {
                    'BucketName': dataBucketName,
                }
            },
            Description='Covid pdfs data',
            RoleArn=roleArn
        )
        return {'PhysicalResourceId' : dataSourceId}
    except:
        raise

def lambda_handler(event, context):
    print("event: {}".format(event))
    request_type = event['RequestType']
    if(request_type == 'Create'): return on_create(event, context)
    if(request_type == 'Update'): return on_update(event, context)
    # Delete case not required as deleting Kendra index deletes the data source as well.
