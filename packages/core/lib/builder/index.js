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

  var currentManifest = false
  
  console.log("buildPath", buildPath)
  sync({
    sources: [path.join(sourcePath, '/**/*'), "!zero/**/*"], 
    target: buildPath, 
    watch: true, 
    clean: true
  }, async (event, file)=>{
    console.log("CHANGE", event, file)
    // recreate manifest
    // TODO: defer creation of manifest until file changes have settled.
    var filesArr = file?[file]:false
    var filesUpdated = file?[]:false
    filesArr && filesArr.forEach((f)=>{
      if (currentManifest.fileToLambdas[f]){
        filesUpdated = filesUpdated.concat(currentManifest.fileToLambdas[f])
        // currentManifest.fileToLambdas[f].forEach((index)=>{
        //   filesUpdated.push(currentManifest.lambdas[index][1])
        // })
      }
    })

    console.log("filesUpdated", filesUpdated)
    const {manifest, forbiddenFiles} = await updateManifest(buildPath, currentManifest, filesUpdated)
    currentManifest = manifest
    onManifest(manifest, forbiddenFiles, filesUpdated)
  })
}


async function updateManifest(buildPath, currentManifest, updatedFiles){
  await installPackages(buildPath, updatedFiles)
  const manifest = await buildManifest(buildPath, currentManifest, updatedFiles)
  
  var forbiddenFiles = []
  manifest.lambdas.forEach((endpoint)=>{
    forbiddenFiles.push(endpoint[1])
    // TODO: see if dependancy tree files are also to be added here or not.
  })
  return {manifest, forbiddenFiles}
}