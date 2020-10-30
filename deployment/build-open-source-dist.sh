#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's top-level directory
# ./build-open-source-dist.sh solution-name
#
# Paramenters:
#  - solution-name: name of the solution for consistency

# Check to see if input has been provided:
if [ -z "$1" ]; then
    echo "Please provide the trademark approved solution name for the open source package."
    echo "For example: ./build-s3-dist.sh trademarked-solution-name"
    exit 1
fi

# Get reference for all important folders
source_template_dir="$PWD"
dist_dir="$source_template_dir/deployment/open-source"
dist_template_dir="$dist_dir/deployment"
source_dir="$source_template_dir/source"

echo "------------------------------------------------------------------------------"
echo "[Init] Clean old open-source folder"
echo "------------------------------------------------------------------------------"
echo "rm -rf $dist_dir"
rm -rf $dist_dir
echo "mkdir -p $dist_dir"
mkdir -p $dist_dir

echo "Copying deployment directory without assets and open source folder"
rsync -av --progress $source_template_dir/deployment/* /$dist_template_dir --exclude "open-source"

echo "------------------------------------------------------------------------------"
echo "[Packing] Source Folder"
echo "------------------------------------------------------------------------------"
echo "cp -r $source_dir $dist_dir"
cp -r $source_dir $dist_dir

echo "cp $source_template_dir/license.txt $dist_dir"
cp $source_template_dir/license.txt $dist_dir
echo "cp $source_template_dir/NOTICE.txt $dist_dir"
cp $source_template_dir/NOTICE.txt $dist_dir
echo "cp $source_template_dir/README.md $dist_dir"
cp $source_template_dir/README.md $dist_dir
echo "cp $source_template_dir/CODE_OF_CONDUCT.md $dist_dir"
cp $source_template_dir/CODE_OF_CONDUCT.md $dist_dir
echo "cp $source_template_dir/CONTRIBUTING.md $dist_dir"
cp $source_template_dir/CONTRIBUTING.md $dist_dir
echo "cp $source_template_dir/CHANGELOG.md $dist_dir"
cp $source_template_dir/CHANGELOG.md $dist_dir
echo "cp $source_template_dir/THIRD-PARTY-LICENSES.txt $dist_dir"
cp $source_template_dir/THIRD-PARTY-LICENSES.txt $dist_dir

echo "------------------------------------------------------------------------------"
echo "[Packing] Create GitHub (open-source) zip file"
echo "------------------------------------------------------------------------------"
echo "cd $dist_dir"
cd $dist_dir

zip -q -r9 ../$1.zip * -x "*.git*" \
-x "*.zip" \
-x "*node_modules*" \
-x "*cdk.out*" \
-x "source/app/out/*" \
-x "*-s3-assets*" \
-x "source/app/.next/*"
echo "Created document-understanding-solution.zip"
echo "Clean up open-source folder"
echo "rm -rf *"
rm -rf *
echo "mv ../$1.zip ."
mv ../$1.zip .
echo "Completed building $1.zip dist"
