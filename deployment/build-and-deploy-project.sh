#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's top level directory

# ./upload-s3-deployment-items.sh deployment-bucket-base-name version-code
#
# Paramenters:
#  - deployment-bucket-base-name: Make an s3 bucket called solutions-[region] where region is where you
#    are deploying the solution. This will hold all of your deployment resources, and mimics the Solutions Builder bucket
#    that is used in the final solution
#
#  - version-code: version of the package

# Check to see if input has been provided:
region="$(aws configure get region)"

if [ -z "$region" ]; then
    echo "No AWS region configured. Please configure your AWS credentials before continuing, using 'aws configure'"
    exit 1
fi

echo "Region is $region"

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Please provide the base source bucket name and version where the lambda code will eventually reside."
    echo "For example: ./upload-s3-deployment-items.sh my-solutions-us-east-1 v1.0.0"
    exit 1
fi

s3bucket="$1-$region"
echo "source bucket is $s3bucket"

# Get reference for all important folders
template_dir="$PWD"
build_dist_dir="$template_dir/deployment/build-dist"

echo "------------------------------------------------------------------------------"
echo "[Init] Clean old dist folders"
echo "------------------------------------------------------------------------------"
echo "rm -rf $build_dist_dir"
rm -rf $build_dist_dir
echo "mkdir -p $build_dist_dir"
mkdir -p $build_dist_dir

echo "------------------------------------------------------------------------------"
echo "[Packing] Templates"
echo "------------------------------------------------------------------------------"
echo "cp $template_dir/deployment/document-understanding-solution.template $build_dist_dir/document-understanding-solution.template"
cp $template_dir/deployment/document-understanding-solution.template $build_dist_dir/document-understanding-solution.template


if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac OS
    echo "Updating code source bucket in template with $1"
    replace="s/%%BUCKET_NAME%%/$1/g"
    echo "sed -i '' -e $replace $build_dist_dir/document-understanding-solution.template"
    sed -i '' -e $replace $build_dist_dir/document-understanding-solution.template
    replace="s/%%VERSION%%/$2/g"
    echo "sed -i '' -e $replace $build_dist_dir/document-understanding-solution.template"
    sed -i '' -e $replace $build_dist_dir/document-understanding-solution.template
else
    # Other linux
    echo "Updating code source bucket in template with $1"
    replace="s/%%BUCKET_NAME%%/$1/g"
    echo "sed -i -e $replace $build_dist_dir/document-understanding-solution.template"
    sed -i -e $replace $build_dist_dir/document-understanding-solution.template
    replace="s/%%VERSION%%/$2/g"
    echo "sed -i -e $replace $build_dist_dir/document-understanding-solution.template"
    sed -i -e $replace $build_dist_dir/document-understanding-solution.template
fi

echo "Creating zip file of project source..."
zip -r document-understanding-solution.zip ./* -x "*pdfgenerator*" \
-x "*boto3*" \
-x "*.git*" \
-x "*node_modules*" \
-x "*cdk.out*" \
-x "app/out/*" \
-x "app/.next/*" \
-x "*document-understanding-cicd*"
echo "Created document-understanding-solution.zip"

echo "Uploading lambda code that is too large to add to CodeCommit (6MB limit)"
aws s3 cp ./lambda/pdfgenerator/searchable-pdf-1.0.jar s3://$s3bucket/document-understanding-solution/$2/searchable-pdf-1.0.jar
aws s3 cp ./lambda/boto3/boto3-layer.zip s3://$s3bucket/document-understanding-solution/$2/boto3-layer.zip

echo "Uploading CloudFormation template and deployment helper lambda code"
aws s3 cp $build_dist_dir/document-understanding-solution.template s3://$s3bucket/document-understanding-solution/$2/document-understanding-solution.template
aws s3 cp ./deployment/document-understanding-cicd.zip s3://$s3bucket/document-understanding-solution/$2/document-understanding-cicd.zip

echo "Uploading solution code"
aws s3 cp ./document-understanding-solution.zip s3://$s3bucket/document-understanding-solution/$2/document-understanding-solution.zip

echo "Creating Cloudformation stack..."
aws cloudformation create-stack --stack-name DocumentUnderstandingSolutionCICD --template-url https://$s3bucket.s3.amazonaws.com/document-understanding-solution/$2/document-understanding-solution.template --capabilities CAPABILITY_NAMED_IAM --disable-rollback