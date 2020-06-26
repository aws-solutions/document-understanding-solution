require("dotenv").config();
const config = () => {
  const {
    env: {
      region,
      UserPoolClientId,
      UserPoolId,
      FileBucketName,
      IdentityPoolId,
      APIGateway,
      DEMOMODE
    }
  } = process;
  return {
    region,
    UserPoolClientId,
    UserPoolId,
    FileBucketName,
    IdentityPoolId,
    APIGateway,
    DEMOMODE
  };
};
module.exports = config;
