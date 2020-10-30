import boto3
import json
import datetime

def convert_datetime_to_string(obj):
    if isinstance(obj, datetime.datetime):
        return obj.__str__()

def on_create(event, context):
    kendra_client = boto3.client('kendra')
    # get status of index
    response = kendra_client.describe_index(Id=event['PhysicalResourceId'])
    is_complete = False
    status = response['Status']
    if status == "CREATING":
        print("Still creating kendra index")
    elif status == "ACTIVE":
        print("Kendra index is now active")
        return { 'IsComplete': True }
    elif status == "FAILED":
        # throw an error
        raise Exception("Kendra index creation failed with reason: {}".format(response['ErrorMessage']))
    elif status == "DELETING" or status == "SYSTEM_UPDATING":
        raise Exception("Kendra index creation shows inconsistent status code, please fix and try again. Reason:{}".format(response['ErrorMessage']))
    return { 'IsComplete': is_complete }

def on_delete(event, context):
    kendra_client = boto3.client('kendra')
    DUSkendraIndexId = event['PhysicalResourceId']
    # check if the list_indices has the index id, if yes, then check status
    kendra_indices = kendra_client.list_indices()
    kendra_indices = json.loads(json.dumps(kendra_indices,default = convert_datetime_to_string))
    kendra_index_ids = []
    for index in kendra_indices['IndexConfigurationSummaryItems']:
        kendra_index_ids.append(index['Id'])
    # if the index id is not present, it has been deleted
    if DUSkendraIndexId not in kendra_index_ids:
        print("Kendra index with id {} deleted".format(DUSkendraIndexId))
        return {'IsComplete': True}
    for indexId in kendra_index_ids:
        if indexId == DUSkendraIndexId:
            response = kendra_client.describe_index(Id=DUSkendraIndexId)
            if response['Status'] == "DELETING":
                print("DUSKendraIndex still deleting")
                return {'IsComplete':False}
            if response['Status'] == "FAILED":
                # send the response as data to aws cloudformation
                print("Delete of Kendra index with id {} failed with response {}".format(DUSkendraIndexId,response))
                return {'IsComplete':True,'Data':response}

def on_update(event, context):
    kendra_client = boto3.client('kendra')
    # get status of index
    response = kendra_client.describe_index(Id=event['PhysicalResourceId'])
    is_complete = False
    status = response['Status']
    if status == "UPDATING":
        print("Still updating kendra index")
    elif status == "ACTIVE":
        print("Kendra index is now updated & active")
        return { 'IsComplete': True }
    elif status == "FAILED":
        raise Exception("Kendra index update failed with reason: {}".format(response['ErrorMessage']))
    elif status == "DELETING" or status == "SYSTEM_UPDATING":
        raise Exception("Kendra index update shows inconsistent status code, please fix and try again. Reason:{}".format(response['ErrorMessage']))
    return { 'IsComplete': is_complete }

def lambda_handler(event, context):
    print("Event: {}".format(event))
    event_type = event['RequestType']
    if event_type == 'Create': return on_create(event, context)
    if event_type == 'Delete': return on_delete(event, context)
    if event_type == 'Update': return on_update(event, context)