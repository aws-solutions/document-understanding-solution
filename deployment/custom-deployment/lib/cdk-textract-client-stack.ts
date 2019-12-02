import { Construct, Stack, StackProps } from '@aws-cdk/core'
import s3 = require('@aws-cdk/aws-s3')
import s3deployment = require('@aws-cdk/aws-s3-deployment')

export class CdkTextractClientStack extends Stack {
  constructor(
    scope: Construct | undefined,
    id: string | undefined,
    props?: StackProps | undefined
  ) {
    super(scope, id, props)

    const clientS3Bucket = 'CLIENT_APP_BUCKET'

    const resourceName = (name: string) => `${id}${name}`

    const clientAppS3Bucket = s3.Bucket.fromBucketName(this, 'ClientAppBucket', clientS3Bucket)

    // eslint-disable-next-line no-unused-vars
    const clientAppS3BucketDeployment = new s3deployment.BucketDeployment(
      this,
      resourceName('DeployClientAppS3Bucket'),
      {
        sources: [s3deployment.Source.asset('app/out')],
        destinationBucket: clientAppS3Bucket,
        destinationKeyPrefix: '',
      }
    )
  }
}
