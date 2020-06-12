const cdk = require("@aws-cdk/core");
const CdkTextractStack = require("../lib/cdk-textract-stack");
const readlineSync = require("readline-sync");
const fs = require("fs");

const app = new cdk.App();
const stackName = `${process.env.STACKNAME}Stack`;

const userEmail =
  process.env.USER_EMAIL == "%%USER_EMAIL%%"
    ? readlineSync.question("Please enter your email address: ")
    : process.env.USER_EMAIL;

const isCICDDeploy = process.env.ISCICD == "false" ? false : true;
const enableKendra = process.env.ENABLE_KENDRA == "true"? true : false;
// eslint-disable-next-line no-new
new CdkTextractStack.CdkTextractStack(app, stackName, {
  email: userEmail,
  isCICDDeploy: isCICDDeploy,
  enableKendra: enableKendra,
});
