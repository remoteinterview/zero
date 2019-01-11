const path = require("path");
const buildManifest = require('./buildManifest');
const prepareBuildFolder = require("./clone")
const installPackages = require("./installPackages")


module.exports = async function build(buildPath){
  await prepareBuildFolder(process.cwd(), buildPath)
  const manifest = await buildManifest(process.cwd(), buildPath)
  console.log(manifest)
  installPackages( buildPath, manifest)
  // lambda files are hidden from being viewed as static files.
  var forbiddenFiles = []
  manifest.forEach((endpoint)=>{
    forbiddenFiles.push(endpoint[1])
    // TODO: see if dependancy tree files are also to be added here or not.
  })
  return {manifest, forbiddenFiles}
}