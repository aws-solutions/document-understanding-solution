global.fetch = require('node-fetch')
global.window = {}
const Amplify = require('aws-amplify')
const config = require('../bin/config')
const AmplifyFromConfig = async () => {
  const {
    FileBucketName: bucket,
    IdentityPoolId: identityPoolId,
    region,
    UserPoolClientId: userPoolWebClientId,
    UserPoolId: userPoolId,
    APIGateway,
  } = await config()
  Amplify.default.configure({
    Analytics: {
      disabled: true,
    },
    Auth: {
      identityPoolId,
      region,
      userPoolId,
      userPoolWebClientId,
    },
    Storage: {
      AWSS3: {
        bucket,
        level: 'private',
      },
    },
    API: {
      endpoints: [
        {
          name: 'TextractDemoTextractAPI',
          endpoint: `https://${APIGateway}.execute-api.${region}.amazonaws.com/prod/`,
          custom_header: async () => {
            return {
              Authorization: `${(await Auth.currentSession()).getAccessToken().getJwtToken()}`,
            }
          },
        },
      ],
    },
  })
}
AmplifyFromConfig()
