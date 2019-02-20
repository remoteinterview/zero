const bundle = require("./bundle")
const path = require('path')
const fs = require('fs')

async function bundler(componentPath, bundlePath, basePath) {
  var fullBundlePath = path.join(process.env.BUILDPATH, bundlePath)
  await bundle(componentPath, fullBundlePath, basePath, bundlePath)

  return {
    js: fs.existsSync(path.join(fullBundlePath, "/bundle.js")) ? path.join(bundlePath, "/bundle.js") : false,
    css: fs.existsSync(path.join(fullBundlePath, "/bundle.css")) ? path.join(bundlePath, "/bundle.css") : false,
  }
}

module.exports = bundler