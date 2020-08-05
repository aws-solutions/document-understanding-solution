#!/bin/bash

source .env

#STACK

echo "==update %%CLIENT_APP_BUCKET%% in stack with $2=="
replace="s/%%CLIENT_APP_BUCKET%%/$ClientAppBucketName/g"
sed -i -e $replace ./lib/cdk-textract-client-stack.js

echo "==update Elastic Search Cluster ($ElasticSearchCluster) with log streams to Log Groups: $ElasticSearchSearchLogGroup and $ElasticSearchIndexLogGroup"
INDEX_LOG_ARN=$(aws logs describe-log-groups --log-group-name $ElasticSearchIndexLogGroup | jq -r '.logGroups[0].arn')
SEARCH_LOG_ARN=$(aws logs describe-log-groups --log-group-name $ElasticSearchSearchLogGroup | jq -r '.logGroups[0].arn')

echo "==adding permissions to ES service role first for creating log stream"
aws logs put-resource-policy --policy-name es-to-log-stream --policy-document '{ "Version": "2012-10-17", "Statement": [ { "Sid": "ElasticSearchLogsToCloudWatchLogs", "Effect": "Allow", "Principal": { "Service": [ "es.amazonaws.com" ] }, "Action":["logs:PutLogEvents", "logs:CreateLogStream", "logs:DeleteLogStream"], "Resource": "*" } ] }'

echo "==Log Groups are $INDEX_LOG_ARN and $SEARCH_LOG_ARN"
aws es update-elasticsearch-domain-config --domain-name $ElasticSearchCluster --log-publishing-options '{"INDEX_SLOW_LOGS": { "CloudWatchLogsLogGroupArn": "'"$INDEX_LOG_ARN"'", "Enabled": true }, "SEARCH_SLOW_LOGS": { "CloudWatchLogsLogGroupArn": "'"$SEARCH_LOG_ARN"'", "Enabled": true } }'


