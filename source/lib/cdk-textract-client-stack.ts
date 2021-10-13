
/**********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import { Construct, Stack, StackProps } from "@aws-cdk/core";
import s3 = require("@aws-cdk/aws-s3");
import s3deployment = require("@aws-cdk/aws-s3-deployment");

export class CdkTextractClientStack extends Stack {
  constructor(
    scope: Construct | undefined,
    id: string | undefined,
    props?: StackProps | undefined
  ) {
    super(scope, id, props);

    const clientS3Bucket = "%%CLIENT_APP_BUCKET%%";

    const resourceName = (name: string) => `${id}${name}`;

    const clientAppS3Bucket = s3.Bucket.fromBucketName(
      this,
      "ClientAppBucket",
      clientS3Bucket
    );

    // eslint-disable-next-line no-unused-vars
    const clientAppS3BucketDeployment = new s3deployment.BucketDeployment(
      this,
      resourceName("DeployClientAppS3Bucket"),
      {
        sources: [s3deployment.Source.asset("app/out")],
        destinationBucket: clientAppS3Bucket,
        destinationKeyPrefix: "",
        memoryLimit: 512
      }
    );
  }
}
