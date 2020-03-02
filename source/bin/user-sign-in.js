require('./node-amplify')
const Amplify = require('aws-amplify')
const UserSignIn = async (email, password) => {
  const { Auth } = Amplify
  const user = await Auth.signIn(email, password).catch(error => {
    return false
  })
  return user
}
module.exports = UserSignIn
