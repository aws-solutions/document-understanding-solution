import boto3

def on_create(event, context):
    kendra_client = boto3.client('kendra')
    # get status of index
    response = kendra_client.describe_index(Id=event['PhysicalResourceId'])
    is_complete = False
    status = response['Status']
    if status == "CREATING":
        print("still creating index")
    elif status == "ACTIVE":
        print("Kendra index is now active")
        return { 'IsComplete': True }
    elif status == "FAILED":
        print("Kendra index creation has failed")
        return { 'IsComplete': True }
    elif status == "DELETING" or status == "SYSTEM_UPDATING":
        print("Kendra index creation shows inconsistent status code, please fix and try again")
    return { 'IsComplete': is_complete }

def on_delete(event, context):
    kendra_client = boto3.client('kendra')
    response = kendra_client.describe_index(Id=event['PhysicalResourceId'])
    if response['Status'] == "DELETING":
        return {'IsComplete': True}

def lambda_handler(event, context):
    print("event: {}".format(event))
    event_type = event['RequestType']
    if event_type == 'Create': return on_create(event, context)
    if event_type == 'Delete': return on_delete(event, context)
    # no need to check isComplete for Update event
    if event_type == 'Update': 
        return {'IsComplete': True}