const ArgPairs = require('../bin/arg-pairs')
const UserConfirm = require('../bin/user-confirm')
const UserCreate = require('../bin/user-create')
const UserSignIn = require('../bin/user-sign-in')
const Amplify = require('aws-amplify')
const { API } = Amplify
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
const getFiles = (documentid) => {
  let apiName = 'TextractDemoTextractAPI';
  let path = 'documents';
  let getData = {
    headers: {},
    response: true,
    queryStringParameters: {}
  }
  return API.get(apiName, path, getData).catch(error => {
    console.log(error.response)
    return error
  });
}
const files = async () => {
  const [email, password] = ArgPairs(['-e', '-p'])
  let userSignIn = await UserSignIn(email, password)
  const userCreate = !!userSignIn ? false : await UserCreate(email, password)
  const userConfirm = userCreate ? await UserConfirm(email) : false
  userSignIn = !!userSignIn ? userSignIn : await UserSignIn(email, password)
  const { data: documentsData } = await getFiles()
  console.log('*** /documents called ***')
  if (documentsData && documentsData.documents){
    const {documents} = documentsData
    console.log(documents)
    const succeeded = documents.filter(({ documentStatus }) => documentStatus === 'SUCCEEDED')
    while(succeeded.length > 0){
      const document = succeeded.shift()
      const { data: getData } = await getFile(document.documentId)
      console.log('*** file called ***')
      const textractResponse = getData.textractResponse ? getData.textractResponse : null
      console.log(textractResponse)
    }
  }
}
files()
