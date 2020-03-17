const inquirer = require('inquirer')
const UserConfirm = require('../bin/user-confirm')
const UserCreate = require('../bin/user-create')

const questions = [
  {
    type: 'input',
    name: 'email',
    message: 'To register as a valid user for your application please enter your email address',
  },
  {
    type: 'input',
    name: 'email2',
    message: 'Enter your email once more with feeling',
  },
  {
    type: 'password',
    name: 'password',
    message: 'And a password',
  },
  {
    type: 'password',
    name: 'password2',
    message: 'Enter your password once more just for practice',
  },
]

function runIt() {
  // eslint-disable-next-line consistent-return
  inquirer.prompt(questions).then(async answers => {
    // eslint-disable-next-line no-console
    if (answers.email !== answers.email2) {
      // eslint-disable-next-line no-console
      console.log('Your email address should be a valid one, perhaps you miss-typed')
      return runIt()
    }
    if (answers.email !== answers.email2) {
      // eslint-disable-next-line no-console
      console.log('Your passwords were a mismatch, we should try again')
      return runIt()
    }
    const create = await UserCreate(answers.email, answers.password)
    const confirm = await UserConfirm(answers.email, answers.password)
    // eslint-disable-next-line no-console
    console.log({ create, confirm })
  })
}

runIt()
