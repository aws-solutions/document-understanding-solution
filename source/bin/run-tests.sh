#!/bin/bash
echo "running tests for S3helper and DynamoDBHelper."
python3 test/test_helper.py
echo "Running tests for datastore"
python3 test/test_datastore.py