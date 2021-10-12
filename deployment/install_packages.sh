#!/bin/bash
current_dir="$PWD"
echo $current_dir
if [ ! -d $current_dir/lambda/boto3/python ]
then
    echo "Installing boto3 and its dependencies..."
    mkdir $current_dir/lambda/boto3/python
    pip3 install -r $current_dir/lambda/boto3/requirements.txt --target=$current_dir/lambda/boto3/python --no-deps --no-cache-dir
    rm -r $current_dir/lambda/boto3/python/__pycache__ && rm -r $current_dir/lambda/boto3/python/bin
else
    rm -r $current_dir/lambda/boto3/python/
    mkdir $current_dir/lambda/boto3/python
    pip3 install -r $current_dir/lambda/boto3/requirements.txt --target=$current_dir/lambda/boto3/python --no-deps --no-cache-dir
    rm -r $current_dir/lambda/boto3/python/__pycache__ && rm -r $current_dir/lambda/boto3/python/bin
fi
cd $current_dir/lambda/boto3
if [ ! -f boto3-layer.zip ]
then
    zip -rq boto3-layer.zip python
    echo "Created boto3-layer.zip"
else
    rm -rf boto3-layer.zip
    zip -rq boto3-layer.zip python
    echo "Created new boto3-layer.zip"
fi
if [ ! -d $current_dir/lambda/elasticsearch/python ]
then
    echo "Installing elasticsearch and its dependencies..."
    mkdir $current_dir/lambda/elasticsearch/python
    pip3 install -r $current_dir/lambda/elasticsearch/requirements.txt --target=$current_dir/lambda/elasticsearch/python --no-deps --no-cache-dir
else
    rm -r $current_dir/lambda/elasticsearch/python/
    mkdir $current_dir/lambda/elasticsearch/python
    pip3 install -r $current_dir/lambda/elasticsearch/requirements.txt --target=$current_dir/lambda/elasticsearch/python --no-deps --no-cache-dir
fi
cd $current_dir/lambda/elasticsearch
if [ ! -f es.zip ]
then
    zip -rq es.zip python
    echo "Created es.zip"
else
    rm -rf es.zip
    zip -rq es.zip python
    echo "Created new es.zip"
fi

cd $current_dir/lambda/barcodeprocessor
source ./pre-build.sh