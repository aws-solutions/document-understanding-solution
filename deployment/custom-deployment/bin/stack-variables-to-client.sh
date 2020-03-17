#!/bin/bash

source .env

#STACK

echo "==update %%CLIENT_APP_BUCKET%% in stack with $2"
replace="s/%%CLIENT_APP_BUCKET%%/$ClientAppBucketName/g"
sed -i -e $replace ./lib/cdk-textract-client-stack.js
