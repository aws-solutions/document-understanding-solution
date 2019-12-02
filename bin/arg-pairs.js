const ArgPairs = (arr = []) => {
  const vals = []
  process.argv.forEach((arg, index) => {
    if (arr.indexOf(arg) !== -1) {
      vals.push(process.argv[index + 1] ? process.argv[index + 1] : '')
    }
  })
  return vals
}

module.exports = ArgPairs
