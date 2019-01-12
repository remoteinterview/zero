const path = require("path");
const buildManifest = require('./buildManifest');
const prepareBuildFolder = require("./clone")
const installPackages = require("./installPackages")
//const syncGlob = require('sync-glob').default
const sync = require("./cloneAndWatch")

module.exports = async function build(buildPath, onManifest){
  const sourcePath = process.cwd()

  // await prepareBuildFolder(sourcePath, buildPath)
  // const manifest = await buildManifest(sourcePath, buildPath)
  // console.log(manifest)
  // installPackages( buildPath, manifest)
  // lambda files are hidden from being viewed as static files.
  var updateManifest = async function(){
    const manifest = await buildManifest(sourcePath, buildPath)
    console.log(manifest)
    installPackages(buildPath, manifest)
    var forbiddenFiles = []
    manifest.forEach((endpoint)=>{
      forbiddenFiles.push(endpoint[1])
      // TODO: see if dependancy tree files are also to be added here or not.
    })
    onManifest(manifest, forbiddenFiles)
    setTimeout(() => {
      // onManifest(manifest, forbiddenFiles)
    }, 4000);
  }

  
  console.log("buildPath", buildPath)
  sync({
    sources: [path.join(sourcePath, '/**/*'), "!zero/**/*"], 
    target: buildPath, 
    watch: true, 
    clean: true
  }, async (event, file)=>{
    console.log("CHANGE", event, file)
    // recreate manifest
    updateManifest()
  })
  //return {manifest:[], forbiddenFiles}
}
