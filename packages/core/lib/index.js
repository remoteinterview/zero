
const build = require("./builder")
const startRouter = require("./router")
const path = require("path")
const fs = require('fs')
const copyDirectory = require("./utils/copyDirectory")
const del = require('del');
const debug = require('debug')('core')
const mkdirp = require('mkdirp');
const slash = require("./utils/fixPathSlashes")
const pkg = require("../package")

var getHash = function(str){
  return require("crypto").createHash('sha1').update(str).digest('hex')
}

function setupEnvVariables(sourcePath){
  // Load environment variables from .env file if present
  require('dotenv').config({path: path.resolve(sourcePath, '.env')})
  // Default env variables.
  process.env.SOURCEPATH = slash(sourcePath)
  const DEFAULTBUILDPATH = path.join( require("os").tmpdir(), "zeroservertmp", getHash(process.env.SOURCEPATH) )
  process.env.PORT = process.env.PORT || 3000
  process.env.SESSION_TTL = process.env.SESSION_TTL || 1000 * 60 * 60 * 24 * 365 // 1 year
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'k3yb0Ard c@t'
  process.env.BUILDPATH = slash(process.env.BUILDPATH || DEFAULTBUILDPATH)

  // create the build folder if not present already
  mkdirp.sync(process.env.BUILDPATH)
}

// npmi module sometime prevents Ctrl+C to shut down server. This helps do that.
if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

process.on("SIGINT", function () {
  //graceful shutdown
  process.exit();
});

function server(path){
  setupEnvVariables(path)
  console.log(`\x1b[2m⚡️ Zero ${pkg.version?`v${pkg.version}`:""}\x1b[0m`)
  var updateManifestFn = startRouter(/*manifest, forbiddenFiles,*/ process.env.BUILDPATH)
  return new Promise((resolve, reject)=>{
    build(path, process.env.BUILDPATH, (manifest, forbiddenFiles, filesUpdated)=>{
      updateManifestFn(manifest, forbiddenFiles, filesUpdated)
      resolve()
    })
  })
}


// Build beforehand
const fork = require('child_process').fork;
const bundlerProgram =  require.resolve("zero-bundler-process")
var getLambdaID = function(entryFile){
  return require("crypto").createHash('sha1').update(entryFile).digest('hex')
}

function getBundleInfo(endpointData){
  return new Promise(async (resolve, reject)=>{
    const entryFilePath = endpointData[1]
    const lambdaID = getLambdaID(endpointData[0])
    if (!bundlerProgram) return resolve(false)
    const parameters = [endpointData[0], endpointData[1], endpointData[2], "zero-builds/" + lambdaID];
    const options = {
      stdio: [ 0, 1, 2, 'ipc' ]
    };

    const child = fork(bundlerProgram, parameters, options);
    child.on('message', message => {
      resolve(message)
    })
  })
}


function builder(sourcePath){
  //process.env.BUILDPATH = path.join(sourcePath, "zero-builds")
  process.env.ISBUILDER = "true"
  process.env.NODE_ENV = "production"
  var bundleInfoMap = {}
  setupEnvVariables(sourcePath)

  return new Promise((resolve, reject)=>{
    build(sourcePath, process.env.BUILDPATH, async (manifest, forbiddenFiles, filesUpdated)=>{
      //console.log(manifest)

      for(var i in manifest.lambdas){
        var endpointData = manifest.lambdas[i]
        var lambdaID = getLambdaID(endpointData[0])
        console.log(`[${(~~i+1)}/${manifest.lambdas.length}] Building`, endpointData[0])
        var info = await getBundleInfo(endpointData)
        bundleInfoMap[lambdaID] = {info} //the router needs the data at .info of each key
      }

      debug("bundleInfo", bundleInfoMap)
      fs.writeFileSync(path.join(process.env.BUILDPATH, "/zero-builds/build-info.json"), JSON.stringify(bundleInfoMap), 'utf8')

      // copy zero-builds folder to local folder
      copyDirectory(path.join(process.env.BUILDPATH, "/zero-builds"), path.join(process.env.SOURCEPATH, "/zero-builds"))

      // clear tmp folder
      await del([path.join(process.env.BUILDPATH, "/**")], {force: true});


    }, true)
  })
}

module.exports = {
  server: server,
  build: builder
}