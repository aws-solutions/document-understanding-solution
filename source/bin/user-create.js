const { exec } = require('child_process')
const config = require('./config')
const UserCreate = (email, password) =>
  // eslint-disable-next-line no-async-promise-executor
  new Promise(async (resolve, reject) => {
    const { region, UserPoolClientId } = await config()
    console.log(UserPoolClientId, region)
    exec(
      `aws cognito-idp sign-up --region ${region} --client-id ${UserPoolClientId} --username ${email} --password ${password}`,
      (err, stdout, stderr) => {
        if (err || stderr) {
          console.log(err, stderr)
          resolve(false)
        }
        resolve(true)
      }
    )
  })
module.exports = UserCreate
