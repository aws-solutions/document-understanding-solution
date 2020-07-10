#!/bin/bash
current_dir="$PWD"
echo $current_dir
cd $current_dir/lambda/boto3
if [ ! -f boto3-layer.zip ]
then
    zip -r boto3-layer.zip python
fi
cd $current_dir/lambda/elasticsearch
if [ ! -f es.zip ]
then
    zip -r es.zip python
fi
cd $current_dir/../deployment
if [ ! -f document-understanding-cicd.zip ]
then
    zip -r document-understanding-cicd.zip document-understanding-cicd
fi