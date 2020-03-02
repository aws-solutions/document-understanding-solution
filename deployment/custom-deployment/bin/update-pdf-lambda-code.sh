#!/bin/bash

### Reuploads the pdfgenerator lambda code (does not get loaded properly during deploy ###

source .env

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

(cd $DIR && 
cd ../../../source/lambda/pdfgenerator && 
aws lambda update-function-code --function-name $PdfGenLambda --zip-file fileb://$PWD/searchable-pdf-1.0.jar)