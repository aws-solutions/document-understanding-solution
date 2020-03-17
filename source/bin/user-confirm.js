const { exec } = require('child_process')
const config = require('./config')
const UserConfirm = email =>
  new Promise(async (resolve, reject) => {
    const { region, UserPoolId } = await config()
    exec(
      `aws cognito-idp admin-confirm-sign-up --region ${region} --user-pool-id ${UserPoolId} --username ${email}`,
      (err, stdout, stderr) => {
        if (err || stderr) {
          console.log(err, stderr)
          resolve(false)
        }
        resolve(true)
      }
    )
  })
module.exports = UserConfirm
