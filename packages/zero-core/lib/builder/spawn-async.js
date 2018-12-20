// forked from https://github.com/ralphtheninja/await-spawn
const { spawn } = require('child_process')

module.exports = (...args) => {
  const child = spawn(...args)
  var stdout = ""
  var stderr = ""

  if (child.stdout) {
    child.stdout.on('data', data => {
      stdout += data
    })
  }

  if (child.stderr) {
    child.stderr.on('data', data => {
      stderr += data
    })
  }

  const promise = new Promise((resolve, reject) => {
//    child.on('error', reject)

    child.on('exit', code => {
      resolve(code)
    })
  })

  promise.child = child

  return promise
}