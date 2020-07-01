"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
const s3deployment = require("@aws-cdk/aws-s3-deployment");
class CdkTextractClientStack extends core_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const clientS3Bucket = "dusstack-dusstackclientapps3bucket8qicpqkyxv5kyhd-14s8tsqi6az0i";
        const resourceName = (name) => `${id}${name}`;
        const clientAppS3Bucket = s3.Bucket.fromBucketName(this, "ClientAppBucket", clientS3Bucket);
        // eslint-disable-next-line no-unused-vars
        const clientAppS3BucketDeployment = new s3deployment.BucketDeployment(this, resourceName("DeployClientAppS3Bucket"), {
            sources: [s3deployment.Source.asset("app/out")],
            destinationBucket: clientAppS3Bucket,
            destinationKeyPrefix: ""
        });
    }
}
exports.CdkTextractClientStack = CdkTextractClientStack;
