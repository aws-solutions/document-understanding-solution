#!/bin/bash
source .env
aws s3 cp ./samples/ s3://$SampleBucketName/public/samples/ --recursive
