#!/bin/bash

### Reuploads the pdfgenerator lambda code (does not get loaded properly during deploy ###

source .env

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

AWS_REGION=$(jq -r '.stack.region' ./package.json)

(cd $DIR && 
cd ../../../source/lambda/pdfgenerator && 
aws lambda update-function-code --region=$AWS_REGION --function-name $PdfGenLambda --zip-file fileb://$PWD/searchable-pdf-1.0.jar)