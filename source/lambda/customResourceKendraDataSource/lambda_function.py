######################################################################################################################
#  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance      #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
#####################################################################################################################

import boto3
import os

def on_create(event, context):
    kendra_client = boto3.client('kendra')
    kendraIndexId = os.environ['KENDRA_INDEX_ID']
    print("Indexing Documents for kendra index id: {}".format(kendraIndexId))
    dataBucketName = os.environ['DATA_BUCKET_NAME']
    roleArn = os.environ['KENDRA_ROLE_ARN']
    
    create_faq_response = kendra_client.create_faq(
        IndexId=kendraIndexId,
        Name="MedicalFAQ",
        Description='medical questions and answers',
        S3Path={
           'Bucket': dataBucketName,
           'Key': 'faqs/medical_faq.csv'
        },
        RoleArn=roleArn
    )
    
    print("Document FAQ created")
    
    # create s3 folders
    s3_client = boto3.client('s3', region_name=os.environ['AWS_REGION'])
    s3_client.put_object(Bucket=os.environ['BULK_PROCESSING_BUCKET'], Key=('documentDrop' +'/'))
    s3_client.put_object(Bucket=os.environ['BULK_PROCESSING_BUCKET'], Key=('kendraPolicyDrop' +'/'))
    
    #copying of the medical the files is done by upload-sample.sh
    
    return


def on_update(event, context):
    return


def lambda_handler(event, context):
    print("Event: {}".format(event))
    request_type = event['RequestType']
    if(request_type == 'Create'): return on_create(event, context)
    if(request_type == 'Update'): return on_update(event, context)
    # Delete case not required as deleting Kendra index deletes the data source as well.
