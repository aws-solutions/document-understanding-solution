const cdk = require("@aws-cdk/core");
const CdkTextractClientStack = require("../deployment/custom-deployment/lib/cdk-textract-client-stack");

const app = new cdk.App();
const stackName = `${process.env.npm_package_stack_name}Client`;
// const stackName = `TextractSolutionClient`
// eslint-disable-next-line no-new
new CdkTextractClientStack.CdkTextractClientStack(app, stackName);
