const { exec } = require("child_process");
const fs = require("fs");
const aws = require("aws-sdk");

const stackName = `${process.env.STACKNAME}Stack`;
const region = process.env.AWS_REGION;
aws.config.region = region;

const cloudformationDescribe = `aws cloudformation describe-stack-resources --region ${region} --stack-name ${stackName}`;

const GetResources = new Promise((resolve, reject) => {
  const cf = new aws.CloudFormation();
  cf.describeStackResources(
    {
      StackName: stackName
    },
    (err, resp) => {
      if (err) {
        reject(err);
      }

      const stackDescriptionObj = resp;

      const ResourceTypesEncodes = [
        {
          type: "AWS::Cognito::IdentityPool",
          key: "IdentityPoolId"
        },
        {
          type: "AWS::Cognito::UserPool",
          key: "UserPoolId"
        },
        {
          type: "AWS::S3::Bucket",
          key: "FileBucketName"
        },
        {
          type: "AWS::Cognito::UserPoolClient",
          key: "UserPoolClientId"
        },
        {
          type: "AWS::ApiGateway::RestApi",
          key: "APIGateway"
        },
        {
          type: "AWS::Lambda::Function",
          key: "PdfGenLambda"
        }
      ];
      const resources = stackDescriptionObj.StackResources.filter(
        resource => resource && resource.ResourceType
      )
        .map(({ PhysicalResourceId, ResourceType }) => ({
          PhysicalResourceId,
          ResourceType
        }))
        .reduce((acc, { PhysicalResourceId, ResourceType }) => {
          const index = ResourceTypesEncodes.map(({ type }) => type).indexOf(
            ResourceType
          );
          if (index !== -1) {
            acc = {
              ...acc,
              [ResourceTypesEncodes.map(({ key }) => key)[
                index
              ]]: PhysicalResourceId
            };
          }
          if (acc.UserPoolId && !acc.region) {
            acc = { ...acc, region: acc.UserPoolId.replace(/((?:_)(.*))/, "") };
          }
          return acc;
        }, {});

      resources.FileBucketName = stackDescriptionObj.StackResources.find(x =>
        /DocumentsS3Bucket/i.test(x.LogicalResourceId)
      ).PhysicalResourceId;
      resources.SampleBucketName = stackDescriptionObj.StackResources.find(x =>
        /SamplesS3Bucket/i.test(x.LogicalResourceId)
      ).PhysicalResourceId;
      resources.ClientAppBucketName = stackDescriptionObj.StackResources.find(
        x => /ClientAppS3Bucket/i.test(x.LogicalResourceId)
      ).PhysicalResourceId;
      resources.PdfGenLambda = stackDescriptionObj.StackResources.find(x =>
        /pdfgenerator/i.test(x.LogicalResourceId)
      ).PhysicalResourceId;

      resolve(resources);
    }
  );
});

const setEnv = async () => {
  const data = await GetResources;
  const outputArray = [];
  Object.keys(data).forEach(key => {
    outputArray.push(`${key}=${data[key]}`);
  });
  fs.writeFileSync(".env", outputArray.join("\n"));
};
setEnv();
