#!/bin/bash

AWS_REGION=$(jq -r '.stack.region' ./package.json)

echo "==Attempting to add service role to Amazon Elasticsearch in region $REGION=="
$(aws iam create-service-linked-role --region $AWS_REGION --aws-service-name es.amazonaws.com && echo "Service role successfully added") || echo "Service role already exists"
