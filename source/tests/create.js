const fs = require('fs')
const ArgPairs = require('../bin/arg-pairs')
const UserConfirm = require('../bin/user-confirm')
const UserCreate = require('../bin/user-create')
const UserSignIn = require('../bin/user-sign-in')
const UserSignOut = require('../bin/user-sign-out')
const UserStorage = require('../bin/user-storage')
const file = fs.readFileSync('./tests/testdocs/employmentapp.png')
const config = require('../bin/config')
const Amplify = require('aws-amplify')
const { Auth, API } = Amplify

const postFile = (bucketname, objectname) => {
  let apiName = 'TextractDemoTextractAPI';
  let path = 'document';
  let postData = { // OPTIONAL
    headers: {}, // OPTIONAL
    response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
    queryStringParameters: {  // OPTIONAL
      bucketname,
      objectname
    }
  }
  return API.post(apiName, path, postData).catch(error => {
    console.log(error.response)
    return error
  });
}
const getFile = (documentid) => {
  let apiName = 'TextractDemoTextractAPI';
  let path = 'document';
  let getData = {
    headers: {},
    response: true,
    queryStringParameters: {  // OPTIONAL
      documentid
    }
  }
  return API.get(apiName, path, getData).catch(error => {
    console.log(error.response)
    return error
  });
}

const create = async () => {
  const {
    FileBucketName: bucketname,
  } = await config()
  const [email, password] = ArgPairs(['-e', '-p'])
  let userSignIn = await UserSignIn(email, password)
  const userCreate = !!userSignIn ? false : await UserCreate(email, password)
  const userConfirm = userCreate ? await UserConfirm(email) : false
  userSignIn = !!userSignIn ? userSignIn : await UserSignIn(email, password)
  const userStorage = await UserStorage()
  const { key: objectname } = await userStorage.put('employmentapp.png', file, { contentType: 'image/png' })
  console.log('*** file uploaded ***')
  console.log({ bucketname, objectname})
  const { data: postData } = await postFile(bucketname, objectname)
  console.log('*** file posted ***')
  console.log({ postData })
  const checkData = async (documentId, fails = 0) => {
    const { data } = await getFile(documentId)
    if (data && data.documentStatus) {
      const { documentStatus} = data
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`${new Date()} : ${documentStatus} : Fails ${fails}`)
      if (documentStatus !== 'SUCCEEDED') {
        await checkData(documentId, fails)
      }
    }else{
      if(fails < 5){
        await checkData(documentId, fails + 1)
      }else{
        console.log('document timed out')
      }
    }
  }
  if(postData && postData.documentId){
    const { documentId } = postData
    console.log('*** file status ***')
    console.log('status:')
    checkData(documentId)
  }
}
create()
