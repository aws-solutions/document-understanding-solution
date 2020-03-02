const { Bucket } = require('@aws-cdk/aws-s3')

const cdk = require('@aws-cdk/core')
const TextractSolutionCognitoStack = require('../deployment/textract-cloudfront')

const app = new cdk.App()
const stackName = `TextractDemoCognito`
// eslint-disable-next-line no-new
console.log('Deploying Cloudfront')
new TextractSolutionCognitoStack(app, stackName, {
  s3SourceBucketArn: 'arn:aws:s3:::v051textractdemoclient-v051textractdemoclients3bu-1ocp8vo88fww4',
})
