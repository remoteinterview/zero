const mkdirp = require('mkdirp')
const path = require('path')
const bundle = require('./bundle')
const fs = require('fs')

var hasBundled = false
module.exports = async (req, res, file, bundlePath, basePath, bundleInfo)=>{
  // generate a bundle if not present already
  // bundlePath = bundlePath + "/html.static" // this causes router to serve our html as static files
  // var fullBundlePath = path.join(process.env.BUILDPATH, bundlePath)
  // if (!hasBundled){
  //   mkdirp.sync(fullBundlePath)
  //   const stats = await bundle(file, fullBundlePath, bundlePath)
  //   hasBundled = true
  // }
  res.sendFile(path.join(process.env.BUILDPATH, bundleInfo.path, "index.html"))
}
