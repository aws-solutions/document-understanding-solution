import boto3
import os

def on_create(event, context):
    kendra_client = boto3.client('kendra')
    kendraIndexId = None
    try:
        print("Creating Kendra Index")
        roleArn = os.environ['KENDRA_ROLE_ARN']
        kmsKeyId = os.environ['KMS_KEY_ID']
        response = kendra_client.create_index(
            Name='DUSKendraIndex',
            Edition='DEVELOPER_EDITION',
            RoleArn= roleArn,
            ServerSideEncryptionConfiguration= {
                'KmsKeyId': kmsKeyId
            },
            Description='Indexes Covid pdfs',
            ClientToken=os.environ['KENDRA_INDEX_CLIENT_TOKEN'],
        )
        kendraIndexId = response['Id']
    except Exception as e:
        print(e)
    print(kendraIndexId)
    responseData = {}
    responseData['KendraIndexId'] = kendraIndexId
    physicalResourceId = kendraIndexId
    return {'PhysicalResourceId': physicalResourceId, 'Data':responseData}

def on_delete(event, context):
    print("Deleting Kendra Index")
    kendra_client = boto3.client('kendra')
    # deleting kendra index also deletes the data source
    response = kendra_client.delete_index(
        Id = event['PhysicalResourceId']
    )
    return

def on_update(event, context):
    kendra_client = boto3.client('kendra')
    if event['PhysicalResourceId'] != None:
        print("Cannot update KMS key for Kendra Index. Please delete the index and try again.")
        raise Exception("Cannot update KMS key for Kendra Index. Please delete the index and try again.")

def lambda_handler(event, context):
    print("event: {}".format(event))
    print(boto3.__version__)
    request_type = event['RequestType']
    if(request_type == 'Create'): return on_create(event, context)
    if(request_type == 'Delete'): return on_delete(event, context)
    if(request_type == 'Update'): return on_update(event, context)
