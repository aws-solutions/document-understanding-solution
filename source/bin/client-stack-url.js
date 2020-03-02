const stackName = process.env.npm_package_stack_name
const aws = require('aws-sdk')
const cf = new aws.CloudFormation()
const GetResources = new Promise((resolve, reject) => {
  cf.describeStackResources({
    StackName: `${stackName}Client`
  }, (err, stackDescriptionObj) => {
    if (err) {
      reject(err)
      return;
    }

    const resources = stackDescriptionObj.StackResources.filter(
      resource => resource && resource.ResourceType && resource.ResourceType === 'AWS::S3::Bucket'
    )
      .map(({ StackId, PhysicalResourceId, ResourceType }) => ({
        region: /arn:aws:cloudformation:(.*?):/.exec(StackId)[1],
        PhysicalResourceId,
        ResourceType,
      }))
      .reduce((acc, { region, PhysicalResourceId }) => {
        return `http://${PhysicalResourceId}.s3-website-${region}.amazonaws.com`
      }, {})
    resolve(resources)
  })
})

const setEnv = async () => {
  const data = await GetResources
  // eslint-disable-next-line no-console
  console.log(data)
}
setEnv()
