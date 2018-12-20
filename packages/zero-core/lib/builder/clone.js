const _rimraf = require('rimraf');
const fs = require("fs");
const path = require("path");
const mkdirp = require('mkdirp');
var copy = require('recursive-copy');


async function prepareBuildFolder(basePath) {
  basePath = basePath || process.cwd()
  var buildPath = path.join(basePath, "./.zero")
  await rimraf(buildPath)
  mkdirp.sync(buildPath)
  await copy(basePath, buildPath, { filter: ['**/*', "!.zero"] })
}

function rimraf(dir) {
  return new Promise(function (resolve, reject) {
    if (fs.existsSync(dir)) {
      _rimraf(dir, function (err) {
        if (err) reject(err)
        else resolve()
      })
    }
    else {
      resolve()
    }
  })
}
module.exports = prepareBuildFolder