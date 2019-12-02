require('./node-amplify')
const Amplify = require('aws-amplify')
const UserSignOut = async (email, password) => {
  const { Auth } = Amplify
  const user = await Auth.signOut({ global: true }).catch(error => {
    return false
  })
  return true
}
module.exports = UserSignOut
