const url = require("url");
//const fetch = require('node-fetch')
const fs = require("fs")
const debug = require('debug')('core')

const stripTrailingSlash = (str) => {
  return str.replace(/^(.+?)\/*?$/, "$1");
};

function matchPathWithDictionary(Manifest, forbiddenStaticFiles, buildPath, path){
  path = url.parse(path).pathname
  path = stripTrailingSlash(path).toLowerCase()
  var staticFile = path.split("/").find((dirname => dirname.endsWith(".static")))
  if (staticFile) return false;

  var match = Manifest.lambdas.find((endpoint)=>{
    debug("matching", path, endpoint[0])

    // check for exact match
    return (endpoint[0] === path || endpoint[0] === path+"/index")
  })

  // check if it's a static file and it's not in the forbidden files
  var staticPath = require('path').join(buildPath, path)
  var hiddenSourceFile = path.split("/").find((dirname => dirname.startsWith("_")))
  if (!hiddenSourceFile
      && !staticFile
      && fs.existsSync(staticPath) 
      && fs.statSync(staticPath).isFile()
      && forbiddenStaticFiles.indexOf(staticPath)=== -1 ){
        return false
  }

  if (!match){
    // check for partial match now ie. query is: /login/username and endpoint will be /login
    // reverse sort to have closest/deepest match at [0] ie. [ "/login/abc/def", "/login/abc", "/login" ]
    var matches = Manifest.lambdas.filter((endpoint) => {
      return endpoint[2]!=="static" && path.startsWith(endpoint[0])
      // if both /user and /users lambdas exist in same directory. 
            && path.replace(endpoint[0],"").startsWith("/")
    }).sort().reverse()
    if (matches && matches[0]){
      return matches[0]
    }
  }
  else{
    return match
  }

  return false
}

module.exports = matchPathWithDictionary