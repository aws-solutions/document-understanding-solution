const cdk = require("@aws-cdk/core");
const CdkTextractStack = require("../deployment/custom-deployment/lib/cdk-textract-stack");
const readlineSync = require("readline-sync");

const app = new cdk.App();
// const stackName = process.env.npm_package_stack_name;
const stackName = "DUSStack";

// const userEmail = readlineSync.question('Please enter your email address: ')

// // eslint-disable-next-line no-new
new CdkTextractStack.CdkTextractStack(app, stackName, {
  email: "gwprice@amazon.com"
  // email: userEmail,
});
