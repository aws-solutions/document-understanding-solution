// const cdk = require('@aws-cdk/cdk')
const cdk = require('@aws-cdk/core')
// const TextractDemoClientStack = require('../lib/client-stack')
const CdkTextractClientStack = require('../deployment/custom-deployment/lib/cdk-textract-client-stack')

const app = new cdk.App()
const stackName = `${process.env.npm_package_stack_name}Client`
// const stackName = `TextractSolutionClient`
// eslint-disable-next-line no-new
// new TextractDemoClientStack(app, stackName)
new CdkTextractClientStack.CdkTextractClientStack(app, stackName)
