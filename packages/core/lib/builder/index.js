const path = require("path");
const buildManifest = require('./buildManifest');
const prepareBuildFolder = require("./clone")
const installPackages = require("./installPackages")


module.exports = async function build(){
  const buildPath = path.join( process.cwd(), ".zero/build" )
  await prepareBuildFolder(process.cwd(), buildPath)
  const manifest = await buildManifest(process.cwd(), buildPath)
  console.log(manifest)
  installPackages( buildPath, manifest)
  return manifest
}