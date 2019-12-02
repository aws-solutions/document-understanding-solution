require('./node-amplify')
const Amplify = require('aws-amplify')
const UserStorage = async () => {
    const {Auth, Storage} = Amplify
    const creds = await Auth.currentSession().catch( e => false)
    if(creds){
        return {
            get: async (name) => {
                return await Storage.get(name, {
                    level: 'public'
                }).catch(error => {
                    return error;
                })
            },
            put: async (name, content) => {
                return await Storage.put(name, content, {
                    level: 'public'
                }).catch(error => {
                    return error;
                })
            },
            remove: async (name) => {
                return await Storage.remove(name, {
                    level: 'public'
                }).catch(error => {
                    return error;
                })
            },
        }
    }else{
        return false
  }
}
module.exports = UserStorage
