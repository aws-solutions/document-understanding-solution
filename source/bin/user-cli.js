const ArgPairs = require('../bin/arg-pairs')
const UserConfirm = require('../bin/user-confirm')
const UserCreate = require('../bin/user-create')
const UserDelete = require('../bin/user-delete')
const run = async () => {
  const f = { UserConfirm, UserCreate, UserDelete }
  const [email, password, functions] = ArgPairs(['-e', '-p', '-c'])
  const commands = functions.split(/,/g)
  while (commands.length > 0) {
    const command = commands.shift()
    const result = f[command] ? await f[command](email, password) : null
    console.log(f[command], result)
  }
}
run()
