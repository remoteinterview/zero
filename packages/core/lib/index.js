
const build = require("./builder")
const startRouter = require("./router")
const path = require("path");

// var Manifest = []
// var forbiddenStaticFiles = {}

var getHash = function(str){
  return require("crypto").createHash('sha1').update(str).digest('hex')
}

// const DEFAULTBUILDPATH = path.join( process.cwd(), ".zero/build" )
const DEFAULTBUILDPATH = path.join( require("os").tmpdir(), getHash(process.cwd()), "/zero-build" )
// Load environment variables from .env file if present
require('dotenv').config({path: path.resolve(process.cwd(), '.env')})

// Default env variables.
process.env.PORT = process.env.PORT || 3000
process.env.SESSION_TTL = process.env.SESSION_TTL || 1000 * 60 * 60 * 24 * 365 // 1 year
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'k3yb0Ard c@t'
process.env.BUILDPATH = process.env.BUILDPATH || DEFAULTBUILDPATH

process.env.SERVERADDRESS = process.env.SERVERADDRESS ||  "http://127.0.0.1:"+process.env.PORT

var updateManifestFn = startRouter(/*manifest, forbiddenFiles,*/ process.env.BUILDPATH)

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
  return new Promise((resolve, reject)=>{
    build(path, process.env.BUILDPATH, (manifest, forbiddenFiles, filesUpdated)=>{
      updateManifestFn(manifest, forbiddenFiles, filesUpdated)
      resolve()
    })
  })
  
}