import boto3
from botocore.config import Config
import os
from zipfile import ZipFile


def download_and_zip_file():
    print(
        f"Downloading from here: {os.environ['BUCKET_NAME']}, {os.environ['SOURCE_KEY']}")
    s3 = boto3.resource('s3')
    s3.meta.client.download_file(
        os.environ['BUCKET_NAME'], os.environ['SOURCE_KEY'], '/tmp/lambda_function.py')
    with ZipFile('/tmp/lam_fun.zip', mode='w') as zfile:
        print("Zipping function")
        try:
            zfile.write("/tmp/lambda_function.py", "lambda_function.py")
        except Exception as ex:
            print(f"Problem zipping: {ex}")
            raise ex


def on_create(event, context):
    my_config = Config(
        region_name='us-east-1',
    )
    lambda_client = boto3.client('lambda', config=my_config)
    cloudfront_client = boto3.client('cloudfront')
    edge_lambda_function_arn = None
    try:
        print("Creating DUS Edge Lambda in us-east-1")

        download_and_zip_file()

        response = lambda_client.create_function(
            FunctionName=os.environ['EDGE_LAMBDA_NAME'],
            Runtime='python3.8',
            Role=os.environ['EDGE_LAMBDA_ROLE_ARN'],
            Handler='lambda_function.lambda_handler',
            Code={
                'ZipFile': open('/tmp/lam_fun.zip', 'rb').read()
            },
            Description='Lambda@Edge for adding security headers',
            Timeout=30,
            MemorySize=1024,
            Publish=True
        )
        print(f"Response is: {response}")
        edge_lambda_function_arn = response['FunctionArn']

        cf_config = cloudfront_client.get_distribution_config(
            Id=os.environ['CLOUDFRONT_DIST_ID']
        )
        # removing ETag required to update distribution using boto3
        deleted_etag = cf_config.pop('ETag', None)

        cf_config['DistributionConfig']['DefaultCacheBehavior']['LambdaFunctionAssociations'] = {
            'Items': [
                {
                    'LambdaFunctionARN': edge_lambda_function_arn,
                    'EventType': 'origin-response',
                    'IncludeBody': False
                }
            ]
        }

    except Exception as e:
        raise e
    print("Created edge lambda function with ARN {}".format(
        edge_lambda_function_arn))
    responseData = {}
    responseData['EdgeLambdaFunctionArn'] = edge_lambda_function_arn
    physicalResourceId = edge_lambda_function_arn
    return {'PhysicalResourceId': physicalResourceId, 'Data': responseData}


def on_delete(event, context):
    print("Deleting edge lambda with name {}".format(
        os.environ['EDGE_LAMBDA_NAME']))
    cloudfront_client = boto3.client('cloudfront')
    lambda_client = boto3.client('lambda')
    # Remove lambda from cloudfront association, and then delete it
    try:
        cf_config = cloudfront_client.get_distribution_config(
            Id=os.environ['CLOUDFRONT_DIST_ID']
        )
        # removing ETag and lambda association, required to update distribution using boto3
        deleted_etag = cf_config.pop('ETag', None)
        deleted_edge_function_association = cf_config['DistributionConfig']['DefaultCacheBehavior'].pop(
            'LambdaFunctionAssociations', None)

        cf_response = cloudfront_client.update_distribution(
            DistributionConfig=cf_config)

        # now delete lambda
        response = lambda_client.delete_function(
            FunctionName=os.environ['EDGE_LAMBDA_NAME']
        )
    except Exception as e:
        raise e
    return


def on_update(event, context):
    return


def lambda_handler(event, context):
    print("Event: {}".format(event))
    request_type = event['RequestType']
    if(request_type == 'Create'):
        return on_create(event, context)
    if(request_type == 'Delete'):
        return on_delete(event, context)
    if(request_type == 'Update'):
        return on_update(event, context)
