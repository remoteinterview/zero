const handlers = require("./handlers")
const http = require('http');
const buildManifest = require('./builder');
const prepareBuildFolder = require("./builder/clone")
const installPackages = require("./builder/installPackages")
const path = require("path");
var Manifest = []

const server = http.createServer((request, response) => {
  //console.log(request.url)
  var endpointData = matchPathWithDictionary(request.url)
  if (endpointData){
    // call relevant handler as defined in manifest
    if (handlers[endpointData[2]]){
      return handlers[endpointData[2]](request, response, endpointData)
    }
  }

  // catch all handler
  return handlers.static(request, response, endpointData)
})

server.listen(process.env.PORT || 3000, () => {
  console.log('Running at http://localhost:3000');
});


async function build(){
  const buildPath = path.join( process.cwd(), ".zero" )
  await prepareBuildFolder(process.cwd(), buildPath)
  Manifest = await buildManifest(process.cwd(), buildPath)
  console.log(Manifest)
  installPackages( buildPath, Manifest)
}

build()


const stripTrailingSlash = (str) => {
  return str.replace(/^(.+?)\/*?$/, "$1");
};

function matchPathWithDictionary(path){
  path = stripTrailingSlash(path)
  var match = Manifest.find((endpoint)=>{
    // first see if endpoint starts with given path
    return endpoint[0].startsWith(path)
    // exact match
      && (endpoint[0] === path || endpoint[0] === path+"/index")
  })

  //match.find()
  //console.log(path, "match", match)
  return match
}