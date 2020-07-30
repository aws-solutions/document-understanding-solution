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
    
    # create s3 folders
    s3_client = boto3.client('s3', region_name=os.environ['AWS_REGION'])
    s3_client.put_object(Bucket=os.environ['BULK_PROCESSING_BUCKET'], Key=('documentDrop' +'/'))
    s3_client.put_object(Bucket=os.environ['BULK_PROCESSING_BUCKET'], Key=('kendraPolicyDrop' +'/'))
    
    # copy the covid pdfs into the bulk processing bucket for processing
    # get a list of all covid pdfs and their associated kendra policy
    response = s3_client.list_objects_v2(Bucket=dataBucketName, MaxKeys=1000)

    s3_resource = boto3.resource('s3', region_name=os.environ['AWS_REGION'])

    # copy over in the bulk bucket the kendra json policy files
    for doc in response['Contents']:
        
        if doc['Key'].split('.')[-1] == 'json':
            
            copy_source = {
                'Bucket': dataBucketName,
                'Key': doc['Key']
            }
            
            destinationKey = doc['Key'].split('/')[2]

            s3_resource.meta.client.copy(copy_source,
                                     os.environ['BULK_PROCESSING_BUCKET'],
                                     'kendraPolicyDrop/' + destinationKey)

    # copy over in the bulk bucket the pdfs
    for doc in response['Contents']:
        
        if doc['Key'].split('.')[-1] == 'pdf':
            
            copy_source = {
                'Bucket': dataBucketName,
                'Key': doc['Key']
            }
            
            destinationKey = doc['Key'].split('/')[2]

            s3_resource.meta.client.copy(copy_source,
                                     os.environ['BULK_PROCESSING_BUCKET'],
                                     'documentDrop/' + destinationKey)

    dataSourceId = "None"
    return {'PhysicalResourceId' : dataSourceId}


def on_update(event, context):
    # not in use
    return


def lambda_handler(event, context):
    print("event: {}".format(event))
    request_type = event['RequestType']
    if(request_type == 'Create'): return on_create(event, context)
    if(request_type == 'Update'): return on_update(event, context)
    # Delete case not required as deleting Kendra index deletes the data source as well.
