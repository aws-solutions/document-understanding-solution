#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh source-bucket-base-name trademarked-solution-name version-code
#
# Paramenters:
#  - source-bucket-base-name: Name for the S3 bucket location where the template will source the Lambda
#    code from. The template will append '-[region_name]' to this bucket name.
#    For example: ./build-s3-dist.sh solutions my-solution v1.0.0
#    The template will then expect the source code to be located in the solutions-[region_name] bucket
#
#  - trademarked-solution-name: name of the solution for consistency
#
#  - version-code: version of the package

# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Please provide the base source bucket name, trademark approved solution name and version where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions trademarked-solution-name v1.0.0"
    exit 1
fi

# Get reference for all important folders
template_dir="$PWD"
template_dist_dir="$template_dir/deployment/global-s3-assets"
build_dist_dir="$template_dir/deployment/regional-s3-assets"

echo "------------------------------------------------------------------------------"
echo "[Init] Clean old dist folders"
echo "------------------------------------------------------------------------------"
echo "rm -rf $build_dist_dir"
rm -rf $build_dist_dir
echo "mkdir -p $build_dist_dir"
mkdir -p $build_dist_dir
echo "rm -rf $template_dist_dir"
rm -rf $template_dist_dir
echo "mkdir -p $template_dist_dir"
mkdir -p $template_dist_dir

echo "------------------------------------------------------------------------------"
echo "[Packing] Templates"
echo "------------------------------------------------------------------------------"
echo "cp $template_dir/deployment/document-understanding-solution.template $template_dist_dir/document-understanding-solution.template"
cp $template_dir/deployment/document-understanding-solution.template $template_dist_dir/document-understanding-solution.template


if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac OS
    echo "Updating code source bucket in template with $1"
    replace="s/%%BUCKET_NAME%%/$1/g"
    echo "sed -i '' -e $replace $template_dist_dir/document-understanding-solution.template"
    sed -i '' -e $replace $template_dist_dir/document-understanding-solution.template
    replace="s/%%SOLUTION_NAME%%/$2/g"
    echo "sed -i '' -e $replace $template_dist_dir/document-understanding-solution.template"
    sed -i '' -e $replace $template_dist_dir/document-understanding-solution.template
    replace="s/%%VERSION%%/$3/g"
    echo "sed -i '' -e $replace $template_dist_dir/document-understanding-solution.template"
    sed -i '' -e $replace $template_dist_dir/document-understanding-solution.template
else
    # Other linux
    echo "Updating code source bucket in template with $1"
    replace="s/%%BUCKET_NAME%%/$1/g"
    echo "sed -i -e $replace $template_dist_dir/document-understanding-solution.template"
    sed -i -e $replace $template_dist_dir/document-understanding-solution.template
    replace="s/%%SOLUTION_NAME%%/$2/g"
    echo "sed -i -e $replace $template_dist_dir/document-understanding-solution.template"
    sed -i -e $replace $template_dist_dir/document-understanding-solution.template
    replace="s/%%VERSION%%/$3/g"
    echo "sed -i -e $replace $template_dist_dir/document-understanding-solution.template"
    sed -i -e $replace $template_dist_dir/document-understanding-solution.template
fi
echo "------------------------------------------------------------------------------"
echo "Creating a zip file of document-understanding-cicd..."
echo "------------------------------------------------------------------------------"
if [ ! -f ./deployment/document-understanding-cicd.zip ]
then
    cd $template_dir/deployment/document-understanding-cicd && npm run build:zip
fi
echo "Created document-understanding-cicd.zip"
cd $template_dir
echo "------------------------------------------------------------------------------"
echo "Installing packages"
echo "------------------------------------------------------------------------------"
cd $template_dir/source/ && bash ../deployment/install_packages.sh
echo "Installed packages for boto3 and elasticsearch"
cd $template_dir
echo "Creating zip file of project source..."
zip -r $build_dist_dir/document-understanding-solution.zip ./* -x "*pdfgenerator*" \
-x "*boto3*" \
-x "source/lambda/elasticsearch/python/*" \
-x "*.git*" \
-x "*node_modules*" \
-x "*cdk.out*" \
-x "source/app/out/*" \
-x "source/app/.next/*" \
-x "*document-understanding-cicd*" \
-x "*open-source*"
echo "Created document-understanding-solution.zip"

echo "Copying lambda code that is too large to add to CodeCommit (6MB limit)"
cp $template_dir/source/lambda/pdfgenerator/searchable-pdf-1.0.jar $build_dist_dir/searchable-pdf-1.0.jar
cp $template_dir/source/lambda/boto3/boto3-layer.zip $build_dist_dir/boto3-layer.zip

echo "Copying CloudFormation template and deployment helper lambda code"
cp ./deployment/document-understanding-cicd.zip $build_dist_dir/document-understanding-cicd.zip

echo "Cleaning up deployment dependency files"
find ./source/lambda/boto3 ! -name 'requirements.txt' -delete
find ./source/lambda/elasticsearch ! -name 'requirements.txt' -delete
rm -rf ./deployment/document-understanding-cicd/node_modules
