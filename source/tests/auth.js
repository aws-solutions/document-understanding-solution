const ArgPairs = require('../bin/arg-pairs')
const UserConfirm = require('../bin/user-confirm')
const UserCreate = require('../bin/user-create')
const UserDelete = require('../bin/user-delete')
const UserSignIn = require('../bin/user-sign-in')
const UserSignOut = require('../bin/user-sign-out')
const UserStorage = require('../bin/user-storage')
const auth = async () => {
  const [email, password] = ArgPairs(['-e', '-p'])
  let userSignIn = await UserSignIn(email, password)
  const userCreate = !!!userSignIn ? await UserCreate(email, password) : false
  const userConfirm = userCreate ? await UserConfirm(email) : false
  userSignIn = !!userSignIn ? userSignIn : await UserSignIn(email, password)
  const userStorage = await UserStorage()
  const userStoragePut = await userStorage.put('test-file.txt', 'Hello Test World')
  const userStorageGet = await userStorage.get('test-file.txt')
  const userStorageRemove = await userStorage.remove('test-file.txt')
  const userSignOut = await UserSignOut()
  const userSignInFailure = await UserSignIn(email, 'fail')
  const userStorageFailure = await UserStorage(userSignInFailure)
  const userDelete = await UserDelete(email)
  console.log({
    userCreate,
    userConfirm,
    userSignIn: !!userSignIn,
    userStoragePut: !!userStoragePut,
    userStorageGet: !!userStorageGet,
    userStorageRemove: !!userStorageRemove,
    userSignOut: !!userSignOut,
    userSignInFailure: !userSignInFailure,
    userStorageFailure: !userStorageFailure,
    userDelete: !!userDelete,
  })
}
auth()
