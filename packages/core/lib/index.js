
const build = require("./builder")
const startRouter = require("./router")
const path = require("path");


// var Manifest = []
// var forbiddenStaticFiles = {}


const DEFAULTBUILDPATH = path.join( process.cwd(), ".zero/build" )


// Default env variables.
process.env.PORT = process.env.PORT || 3000
process.env.SESSION_TTL = process.env.SESSION_TTL || 1000 * 60 * 60 * 24 * 365 // 1 year
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'k3yb0Ard c@t'
process.env.BUILDPATH = process.env.BUILDPATH || DEFAULTBUILDPATH

var serverAddress = "http://127.0.0.1:"+process.env.PORT

build(process.env.BUILDPATH).then(({manifest, forbiddenFiles})=>{
  startRouter(manifest, forbiddenFiles, process.env.BUILDPATH, serverAddress)
})
