# Document Understanding Solution

There are multiple options to deploy the solution. Please review them below-

## 1. CICD Deploy

### Requirements

- aws cli

### Getting Started with Full Deploy

- Create a bucket to act as the target Amazon S3 distribution bucket

_Note:_ You will have to create an S3 bucket with the template 'my-bucket-name-<aws_region>'; aws_region is where you are testing the customized solution. 

For example, you create a bucket called `my-solutions-bucket-us-east-1`,

- Now build the distributable:

```
chmod +x ./deployment/build-s3-dist.sh
./deployment/build-s3-dist.sh <bucket-name-minus-region> <solution-name> <version>
```

For example,

```
./deployment/build-s3-dist.sh my-solutions-bucket document-understanding-solution v1.0.0
```

- Deploy the distributable to an Amazon S3 bucket in your account. _Note:_ you must have the AWS Command Line Interface installed.

```
aws s3 cp ./deployment/global-s3-assets/ s3://my-bucket-name-<aws_region>/<solution_name>/<my-version>/ --recursive --acl bucket-owner-full-control --profile aws-cred-profile-name
aws s3 cp ./deployment/regional-s3-assets/ s3://my-bucket-name-<aws_region>/<solution_name>/<my-version>/ --recursive --acl bucket-owner-full-control --profile aws-cred-profile-name
```

- Get the link of the document-understanding-solution.template uploaded to your Amazon S3 bucket.
- Deploy the Document Understanding solution to your account by launching a new AWS CloudFormation stack using the link of the document-understanding-solution.template.

```
aws cloudformation create-stack --stack-name DocumentUnderstandingSolutionCICD --template-url https://my-bucket-name-<aws_region>.s3.amazonaws.com/<solution_name>/<my_version>/document-understanding-solution.template --parameters ParameterKey=Email,ParameterValue=<my_email> --capabilities CAPABILITY_NAMED_IAM --disable-rollback
```

This solutions will create 6 S3 buckets that need to be manually deleted when the stack is destroyed (Cloudformation will only delete the solution specific CDK toolkit bucket. The rest are preserved to prevent accidental data loss).

- 2 for CICD
- 1 for solution specific CDK Toolkit
- 2 for documents (sample and general documents)
- 1 for the client bucket
- 1 for CDK toolkit (if this is the customer's first try with CDK)

### Notes

- Do NOT change the `cicd` in package.json. This field is for the deployment system to use in CodePipeline
- Due to limitations of CodeCommit, you cannot use this deploy approach if you add a file to the solution that is above 6MB (for good measure, stay below 5MB)

## 2. Development Deploy

There is also a deploy option for developers, and those wishing to modify the source code. This deploy does not involve creating any buckets, and allows for running the client-side code on a local server.

### Requirements

- yarn
- node 10+
- aws cli
- tsc
- jq

To deploy using this approach, you must first set several values inside the `package.json` file in the `source` folder.

- Set your deployment region in the `stack->region` property, replacing `"%%REGION%%"`. Unlike the regular CICD deploy, this approach will not pull the AWS region from your current AWS profile.
- Enter your email into the `email` property, replacing `"%%USER_EMAIL%%"`

Now switch to the source directory, and use yarn to deploy the solution:

```
cd ./source
```

```
yarn && yarn deploy
```

The cli will prompt for approval on IAM Roles and Permissions twice in the full deploy. Once for the backend stack and then again for the client stack. The cli will prompt for an email. After the deploy is complete, an email will be sent to address provided with credentials for logging in.

Note:

This will create 3 or 4 S3 buckets that will have to be manually deleted when the stack is destroyed (Cloudformation does not delete them, in order to avoid data loss).

- 2 for documents (sample and general documents)
- 1 for the client bucket
- 1 for CDK toolkit (if this is your first time using CDK)

### Development Deploy Commands

- `yarn deploy:backend` : deploys or updates the backend stack
- `yarn deploy:client` : deploys or updates the client app
- `yarn deploy:setup-samples` : push sample docs to s3
- `yarn deploy:setup-user` : initiated prompts to set up a user
- `yarn deploy:show` : displays the url of the client app
- `yarn destroy` : tears down the CloudFormation backend and client stacks

### Development Deploy Workflow and stacknaming

The `package.json` script node `stackname` sets the stackname for the deploy commands. Throughout development it has been imperative to maintain multiple stacks in order to allow client app development and stack architecture development to work without creating breaking changes. When a new stackname is merged into develop it should have the most up to date deployments.

### Developing Locally
Once deployed into the AWS account, you can also deploy locally for web development
This application uses [next.js](https://github.com/zeit/next.js/) along with [next-scss](https://github.com/zeit/next-plugins/tree/master/packages/next-sass) — all documentation for those packages apply here. NOTE: This application uses the static export feature of next.js — be aware of the limited features available when using static export.

### Start Dev Server

- Clone this repository
- Run `yarn` to install/update packages
- Run `yarn dev`
- Navigate to http://localhost:3000
- NOTE: The dev build is noticeably slower than the production build because pages are built/unbuilt on-demand. Also, the code in the dev build is uncompressed and includes extra code for debugging purposes.

### Generate Production Build

- Run `yarn export` to create a static export of the application.
- In a terminal go to the `app/out` directory and run `python -m SimpleHTTPServer`
- Navigate to http://localhost:8000

### Code Quality Tools

This project uses [Prettier](https://prettier.io) to format code. It is recommended to install a [Prettier extension for your editor](https://prettier.io/docs/en/editors.html) and configure it to format on save. You can also run `yarn prettier` to auto-format all files in the project (make sure you do this on a clean working copy so you only commit formatting changes).

This project also uses ESLint and sass-lint to help find bugs and enforce code quality/consistency. Run `yarn lint:js` to run ESLint. Run `yarn lint:css` to run sass-lint. Run `yarn lint` to run them both.

### Generating License Report

Run `yarn license-report` to generate a license report for all npm packages. See output in `license-report.txt`.

## Cost

- As you deploy this sample application, it creates different resources (Amazon S3 bucket, Amazon DynamoDB table, and AWS Lambda functions etc.). When you analyze documents, it calls different APIs (Amazon Textract) in your AWS account. You will get charged for all the API calls made as part of the analysis as well as any AWS resources created as part of the deployment. To avoid any recurring charges, delete stack using "cdk destroy".

- There are 3 SQS queues created as part of this solution, and every one of them has a Lambda that is polling them once every 4 seconds. This means that, after about 15 days, the solution will use up the 1,000,000 requests associated with the AWS free tier, and you will start receiving charges for every SQS request. Please follow this link for more information: https://aws.amazon.com/sqs/pricing/

- The CDK Toolkit stacks that are created during deploy of this solution are not destroyed when you tear down the solution stacks. If you want to remove these resources, delete the S3 bucket that contains `staging-bucket` in the name, and then delete the `CDKToolkit` stack.

## Delete demo application

1. Full CICD Deploy:

Either run `aws cloudformation delete-stack --stack-name {CICD stack}`, or go to Cloudformation in the AWS Console and delete the stack that ends with "CICD". You will also have to go to CodeCommit in the console and manually delete the Repository that was created during the deploy.

2. Dev Deploy:

Make sure you are in the `source` directory, and then run `yarn destroy`.

## License

This project is licensed under the Apache-2.0 License.
You may not use this file except in compliance with the License. A copy of the License is located at
http://www.apache.org/licenses/


## Additional Notes

 The intended use is for users to use this application as a reference architecutre to build production ready systems for their use cases. Users will deploy this solution in their own AWS accounts and own the deployment, maintenance and updates of their applications based on this solution.

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
