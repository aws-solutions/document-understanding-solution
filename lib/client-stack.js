const { Stack } = require('@aws-cdk/cdk')
const s3 = require('@aws-cdk/aws-s3')
const s3deployment = require('@aws-cdk/aws-s3-deployment')

class TextractDemoClientStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props)

    const resourceName = name => `${id}${name}`
    const addCorstoBucket = bucket => {
      const cfnBucket = bucket.node.findChild('Resource')
      cfnBucket.addPropertyOverride('CorsConfiguration', {
        CorsRules: [
          {
            AllowedOrigins: ['*'],
            AllowedMethods: ['HEAD', 'GET', 'PUT', 'POST', 'DELETE'],
            MaxAge: '3000',
            ExposedHeaders: ['ETag'],
            AllowedHeaders: ['*'],
          },
        ],
      })
    }

    //**********ClientAppS3Bucket*****************************
    const clientAppS3Bucket = new s3.Bucket(this, resourceName('S3Bucket'), {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
    })
    addCorstoBucket(clientAppS3Bucket)

    clientAppS3Bucket.grantPublicAccess()

    // eslint-disable-next-line no-unused-vars
    const clientAppS3BucketDeployment = new s3deployment.BucketDeployment(
      this,
      resourceName('DeployClientAppS3Bucket'),
      {
        source: s3deployment.Source.asset('app/out'),
        destinationBucket: clientAppS3Bucket,
        destinationKeyPrefix: '',
      }
    )
  }
}
module.exports = TextractDemoClientStack
