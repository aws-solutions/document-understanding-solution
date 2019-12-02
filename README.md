# Amazon Textract Document Understanding Solution

## Development Deploy

### Requirements

- yarn
- node 10+
- aws cli
- tsc

### Getting Started with Full Deploy

Prerequisites:
- Set your deployment region in the stack->region property of package.json.
- If you have never used CDK before, then the deployment command below may fail with a message saying that you first need to run `cdk bootstrap {accountId}/{region}`. This will deploy a small stack with resources for running CDK. Afterwards, run the below yarn command again.

```
yarn && yarn deploy
```

The cli will prompt for approval on IAM Roles and Permissions twice in the full deploy. Once for the backend stack and then again for the client stack. The cli will prompt for an email. After the deploy is complete, an email will be sent to address provided with credentials for logging in.

### Development Deploy Commands

- `yarn deploy:stack` : deploys or updates the backend stack
- `yarn deploy:client` : deploys or updates the client app
- `yarn deploy:setup-samples` : push sample docs to s3
- `yarn deploy:setup-user` : initiated prompts to set up a user
- `yarn deploy:show` : displays the url of the client app
- `yarn destroy` : tears down the CloudFormation backend stack

### Development Deploy Workflow and stacknaming

The `package.json` script node `stackname` sets the stackname for the deploy commands. Throughout development it has been imparative to maintain multiple stacks in order to allow client app development and stack architecture development to work without creating breaking changes. When a new stackname is merged into develop it should have the most up to date deployments.

## Developing Locally

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

## Delete demo application
- Run: yarn destroy

## License

This project is licensed under the Apache-2.0 License.
