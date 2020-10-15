import * as cdk from "@aws-cdk/core";
import * as cr from "@aws-cdk/custom-resources";
import * as iam from "@aws-cdk/aws-iam";

interface SsmParameterReaderProps {
  parameterName: string;
  region: string;
  uuid: string;
}

export class SsmParameterReader extends cdk.Construct {
  private reader: cr.AwsCustomResource;

  get stringValue(): string {
    return this.getParameterValue();
  }

  constructor(
    scope: cdk.Construct,
    name: string,
    props: SsmParameterReaderProps
  ) {
    super(scope, name);

    const { parameterName, region } = props;

    const customResource = new cr.AwsCustomResource(
      scope,
      `${name}-CustomResource-${props.uuid}`,
      {
        policy: cr.AwsCustomResourcePolicy.fromStatements([
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ssm:GetParameter*"],
            resources: [
              cdk.Stack.of(this).formatArn({
                service: "ssm",
                region,
                resource: "parameter",
                resourceName: parameterName.replace(/^\/+/, ""), // remove leading '/', since formatArn() will add one
              }),
            ],
          }),
        ]),
        onUpdate: {
          service: "SSM",
          action: "getParameter",
          parameters: {
            Name: parameterName,
          },
          region,
          physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()), // Update physical id to always fetch the latest version
        },
      }
    );
    this.reader = customResource;
  }

  private getParameterValue(): string {
    return this.reader.getResponseField("Parameter.Value");
  }
}
