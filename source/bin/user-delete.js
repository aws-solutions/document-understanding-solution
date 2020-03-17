const { exec } = require('child_process')
const config = require('./config')
const UserDelete = email =>
  new Promise(async (resolve, reject) => {
    const { region, UserPoolId } = await config()
    exec(
      `aws cognito-idp admin-delete-user --region ${region} --user-pool-id ${UserPoolId} --username ${email}`,
      (err, stdout, stderr) => {
        if (err || stderr) {
          console.log(err, stderr)
          resolve(false)
        }
        resolve(true)
      }
    )
  })
module.exports = UserDelete
