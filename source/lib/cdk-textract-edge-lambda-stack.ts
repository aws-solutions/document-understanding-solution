import cdk = require("@aws-cdk/core");
import iam = require("@aws-cdk/aws-iam");
import lambda = require("@aws-cdk/aws-lambda");
import s3 = require("@aws-cdk/aws-s3");
import s3deploy = require("@aws-cdk/aws-s3-deployment");
import { CloudFrontWebDistribution } from "@aws-cdk/aws-cloudfront";
import uuid = require("short-uuid");
import { BucketEncryption, BlockPublicAccess } from "@aws-cdk/aws-s3";
import { CustomResource, Duration } from "@aws-cdk/core";
import * as cr from "@aws-cdk/custom-resources";
import cfn = require("@aws-cdk/aws-cloudformation");

interface EdgeLambdaStackProps extends cfn.NestedStackProps {
  cloudfrontDistribution: CloudFrontWebDistribution;
}

export class EdgeLambdaStack extends cfn.NestedStack {
  uuid: string;
  resourceName: (name: any) => string;
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(
    scope: cdk.Construct | undefined,
    id: string | undefined,
    props: EdgeLambdaStackProps
  ) {
    super(scope, id, props);

    this.resourceName = (name: any) =>
      `${id}-${name}-${this.uuid}`.toLowerCase();

    this.uuid = uuid.generate();

    const edgeLambdaCodeBucket = new s3.Bucket(
      this,
      this.resourceName("edgeLambdaCodeBucket"),
      {
        accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
        versioned: false,
        encryption: BucketEncryption.S3_MANAGED,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      }
    );

    const edgeCodeDeployment = new s3deploy.BucketDeployment(
      this,
      this.resourceName("EdgeLambdaDeployment"),
      {
        sources: [s3deploy.Source.asset("lambda/edge")],
        destinationBucket: edgeLambdaCodeBucket,
      }
    );

    const egdeLambdaRole = new iam.Role(
      this,
      this.resourceName("EdgeLambdaServiceRole"),
      {
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal("lambda.amazonaws.com"),
          new iam.ServicePrincipal("edgelambda.amazonaws.com")
        ),
        inlinePolicies: {
          BasicExecution: new iam.PolicyDocument({
            assignSids: true,
            statements: [
              new iam.PolicyStatement({
                actions: [
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents",
                ],
                resources: ["*"],
              }),
            ],
          }),
        },
      }
    );

    const onEventEdgeLambdaCreator = new lambda.Function(
      this,
      this.resourceName("onEventEdgeLambdaCreator"),
      {
        code: lambda.Code.fromAsset("lambda/customResourceEdgeLambdaCreator/"),
        description: "onEvent handler for creating Edge Lambda",
        runtime: lambda.Runtime.PYTHON_3_8,
        handler: "lambda_function.lambda_handler",
        timeout: Duration.minutes(15),
        environment: {
          EDGE_LAMBDA_NAME: this.resourceName("DUSEdgeLambda"),
          EDGE_LAMBDA_ROLE_ARN: egdeLambdaRole.roleArn,
          SOURCE_KEY: "lambda_function.py",
          CLOUDFRONT_DIST_ID: props.cloudfrontDistribution.distributionId,
          BUCKET_NAME: edgeLambdaCodeBucket.bucketName,
        },
      }
    );

    onEventEdgeLambdaCreator.node.addDependency(edgeCodeDeployment);

    onEventEdgeLambdaCreator.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "lambda:CreateFunction",
          "lambda:DeleteFunction",
          "lambda:GetFunction",
          "lambda:EnableReplication*",
          "lambda:PublishVersion",
        ],
        resources: ["arn:aws:lambda:us-east-1:" + this.account + ":*"],
      })
    );

    onEventEdgeLambdaCreator.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "iam:PassRole",
          "iam:CreateServiceLinkedRole",
          "iam:DeleteServiceLinkedRole",
        ],
        resources: [egdeLambdaRole.roleArn],
      })
    );

    onEventEdgeLambdaCreator.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:Get*", "s3:List*"],
        resources: [
          edgeLambdaCodeBucket.bucketArn,
          `${edgeLambdaCodeBucket.bucketArn}/*`,
        ],
      })
    );

    onEventEdgeLambdaCreator.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "cloudfront:GetDistributionConfig",
          "cloudfront:UpdateDistribution",
          "cloudfront:ListDistributions",
          "cloudfront:GetDistribution",
        ],
        resources: ["*"],
      })
    );

    const edgeLambdaProvider = new cr.Provider(
      this,
      this.resourceName("EdgeLambdaProvider"),
      {
        onEventHandler: onEventEdgeLambdaCreator,
      }
    );

    const onEventEdgeLambdaCustomResource = new CustomResource(
      this,
      this.resourceName("EdgeLambdaCreatorCR"),
      {
        serviceToken: edgeLambdaProvider.serviceToken,
      }
    );

    onEventEdgeLambdaCustomResource.node.addDependency(
      props.cloudfrontDistribution
    );
  }
}
