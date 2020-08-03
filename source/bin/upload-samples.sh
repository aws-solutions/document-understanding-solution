#!/bin/bash
source .env
aws s3 cp ./samples/ClassicMode/ s3://$SampleBucketName/public/samples/ --recursive
if [ $ENABLE_KENDRA = "true" ]
then
    aws s3 sync s3://$CovidDataBucketName/documents/GeneralPublic/policy/  s3://$BulkProcessingBucketName/kendraPolicyDrop/
    aws s3 sync s3://$CovidDataBucketName/documents/HealthcareProvider/policy/  s3://$BulkProcessingBucketName/kendraPolicyDrop/
    aws s3 sync s3://$CovidDataBucketName/documents/Scientist/policy/  s3://$BulkProcessingBucketName/kendraPolicyDrop/
    aws s3 sync s3://$CovidDataBucketName/documents/GeneralPublic/pdf/  s3://$BulkProcessingBucketName/documentDrop/
    aws s3 sync s3://$CovidDataBucketName/documents/HealthcareProvider/pdf/  s3://$BulkProcessingBucketName/documentDrop/
    aws s3 sync s3://$CovidDataBucketName/documents/Scientist/pdf/  s3://$BulkProcessingBucketName/documentDrop/
fi


