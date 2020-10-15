import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as ssm from '@aws-cdk/aws-ssm';
// import { ServicePrincipals, ManagedPolicies } from 'cdk-constants';
import uuid = require("short-uuid");


// interface EdgeLambdaStackProps extends cdk.StackProps {
//   lambdaFunctionArnParameterName: string;
// }

export class EdgeLambdaStack extends cdk.Stack {
    uuid: string;
    resourceName: (name: any) => string;

  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    this.resourceName = (name: any) =>
      `${id}-${name}-${this.uuid}`.toLowerCase();

    this.uuid = uuid.generate();

    if (props.env?.region !== 'us-east-1') {
      throw new Error("The stack contains Lambda@Edge functions and must be deployed in 'us-east-1'");
    }

    // const { lambdaFunctionArnParameterName } = props

    const { managedPolicyArn } = iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole");

    const ssrLambda = new lambda.Function(this, this.resourceName('EdgeLambdaFunction'), {
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.asset('lambda/edge'),
      handler: 'lambda_function.lambda_handler',
      role: new iam.Role(this, this.resourceName('EdgeLambdaServiceRole'), {
        assumedBy: new iam.CompositePrincipal(
            new iam.ServicePrincipal("lambda.amazonaws.com"),
            new iam.ServicePrincipal("edgelambda.amazonaws.com")
        ),
        managedPolicies: [
          {
            managedPolicyArn,
          },
        ],
      }),
    });

    const { functionArn } = ssrLambda.currentVersion;

    new ssm.StringParameter(this, this.resourceName('LambdaFunctionArnParameter'), {
      parameterName: "lambdaFunctionArnParameterName",
      stringValue: functionArn,
    });
  }
}