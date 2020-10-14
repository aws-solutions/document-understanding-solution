import boto3
import os

def on_create(event, context):
    kendra_client = boto3.client('kendra')
    kendraIndexId = None
    try:
        print("Creating DUS Kendra Index")
        roleArn = os.environ['KENDRA_ROLE_ARN']
        kmsKeyId = os.environ['KMS_KEY_ID']
        kendraIndexClientToken = os.environ['KENDRA_INDEX_CLIENT_TOKEN']
        response = kendra_client.create_index(
            Name='DUSKendraIndex'+kendraIndexClientToken,
            Edition='DEVELOPER_EDITION',
            RoleArn= roleArn,
            ServerSideEncryptionConfiguration= {
                'KmsKeyId': kmsKeyId
            },
            Description='Indexes medical pdf data from data source.',
            ClientToken=kendraIndexClientToken,
        )
        kendraIndexId = response['Id']
    except Exception as e:
        raise e
    print("Started Create for Kendra index with id {}".format(kendraIndexId))
    responseData = {}
    responseData['KendraIndexId'] = kendraIndexId
    physicalResourceId = kendraIndexId
    return {'PhysicalResourceId': physicalResourceId, 'Data':responseData}

def on_delete(event, context):
    DUSKendraIndexId = event['PhysicalResourceId']
    print("Deleting Kendra Index with id {}".format(DUSKendraIndexId))
    kendra_client = boto3.client('kendra')
    # deleting kendra index also deletes the data source
    try:
        response = kendra_client.delete_index(
            Id = DUSKendraIndexId
        )
    except:
        raise
    return

def on_update(event, context):
    kendra_client = boto3.client('kendra')
    DUSKendraIndexId = event['PhysicalResourceId']
    roleArn = os.environ['KENDRA_ROLE_ARN']
    new_kms_id = os.environ['KMS_KEY_ID']
    kendraIndexClientToken = os.environ['KENDRA_INDEX_CLIENT_TOKEN']
    old_kms_id = event['OldResourceProperties']['kendraKMSKeyId']
    if (new_kms_id != old_kms_id):
        raise Exception("Update of KMS key id for Kendra index is not allowed. Please delete the index and try again.")
    else:
        try:
            print("Updating kendra index with id {}".format(DUSKendraIndexId))
            update_index_response = kendra_client.update_index(
                Id=DUSKendraIndexId,
                Name='DUSKendraIndex'+kendraIndexClientToken,
                RoleArn=roleArn,
                Description="Indexes medical pdf data from a data source."
            )
        except:
            # if the update_index operation fails due to some other error
            raise
        responseData = {}
        responseData['KendraIndexId'] = DUSKendraIndexId
        physicalResourceId = DUSKendraIndexId
        return {'PhysicalResourceId': physicalResourceId, 'Data':responseData}


def lambda_handler(event, context):
    print("Event: {}".format(event))
    request_type = event['RequestType']
    if(request_type == 'Create'): return on_create(event, context)
    if(request_type == 'Delete'): return on_delete(event, context)
    if(request_type == 'Update'): return on_update(event, context)
