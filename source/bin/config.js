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
      isROMode
    }
  } = process;
  return {
    region,
    UserPoolClientId,
    UserPoolId,
    FileBucketName,
    IdentityPoolId,
    APIGateway,
    isROMode
  };
};
module.exports = config;
