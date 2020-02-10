require("dotenv").config();
const config = () => {
  const {
    env: {
      region,
      UserPoolClientId,
      UserPoolId,
      FileBucketName,
      IdentityPoolId,
      APIGateway
    }
  } = process;
  return {
    region,
    UserPoolClientId,
    UserPoolId,
    FileBucketName,
    IdentityPoolId,
    APIGateway
  };
};
module.exports = config;
