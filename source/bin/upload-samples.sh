#!/bin/bash
source .env
aws s3 cp ./samples/ s3://$SampleBucketName/public/samples/ --recursive

aws s3 cp ./GeneralPublic/policy/ s3://$BulkProcessingBucketName/kendraPolicyDrop/ --recursive
aws s3 cp ./HealthcareProvider/policy/ s3://$BulkProcessingBucketName/kendraPolicyDrop/ --recursive
aws s3 cp ./Scientist/policy/ s3://$BulkProcessingBucketName/kendraPolicyDrop/ --recursive

aws s3 cp ./GeneralPublic/pdf/ s3://$BulkProcessingBucketName/documentDrop/ --recursive
aws s3 cp ./HealthcareProvider/pdf/ s3://$BulkProcessingBucketName/documentDrop/ --recursive
aws s3 cp ./Scientist/pdf/ s3://$BulkProcessingBucketName/documentDrop/ --recursive


