
const build = require("./builder")
const startRouter = require("./router")
const path = require("path");
const mkdirp = require('mkdirp');
const slash = require("./utils/fixPathSlashes")
var getHash = function(str){
  return require("crypto").createHash('sha1').update(str).digest('hex')
}

function setupEnvVariables(sourcePath){
  // Load environment variables from .env file if present
  require('dotenv').config({path: path.resolve(sourcePath, '.env')})
  // Default env variables.
  process.env.SOURCHPATH = slash(sourcePath)
  const DEFAULTBUILDPATH = path.join( require("os").tmpdir(), getHash(process.env.SOURCHPATH) )
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


module.exports = async (path)=>{
  setupEnvVariables(path)
  var updateManifestFn = startRouter(/*manifest, forbiddenFiles,*/ process.env.BUILDPATH)
  return new Promise((resolve, reject)=>{
    build(path, process.env.BUILDPATH, (manifest, forbiddenFiles, filesUpdated)=>{
      updateManifestFn(manifest, forbiddenFiles, filesUpdated)
      resolve()
    })
  })
}