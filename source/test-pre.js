const { exec } = require("child_process");
const fs = require("fs");
const aws = require("aws-sdk");
const _ = require("lodash");

// const stackName = `${process.env.STACKNAME}Stack`;
const region = process.env.AWS_REGION;
aws.config.region = "us-west-2";

const stackName = "DUSStack";

const cloudformationDescribe = `aws cloudformation list-stack-resources --page-size 200 --region ${region} --stack-name ${stackName}`;

// listStackResources needs to be called twice in order to get the full stack.
const listFullStack = (stackName, callback) => {
  const cf = new aws.CloudFormation();
  cf.listStackResources(
    {
      StackName: stackName
    },
    (err, resp) => {
      console.log(resp);
      console.log(err);
      callback(err, resp);
    }
  );
};
console.log("sjklfhsjkld");
listFullStack(stackName, (err, resp) => console.log(resp));
