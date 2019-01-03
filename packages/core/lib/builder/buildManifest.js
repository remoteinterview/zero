var glob = require("glob")
//var { spawnSync } = require("child_process")
var spawnAsync = require("./spawn-async")

var validators = {
  js: require.resolve("zero-lambda-js/validate.js"),
  react: require.resolve("zero-lambda-react/validate.js")
}

async function getFiles(baseSrc) {
  return new Promise((resolve, reject)=>{
    glob(baseSrc + '/**/*', {nodir: true, dot: true}, (err, res)=>{
      if (err) return reject(err)
      resolve(res)
    });
  })
}

async function buildManifest(basePath, buildPath){
  basePath = basePath.endsWith("/")? basePath : (basePath + "/")
  buildPath = buildPath.endsWith("/")? buildPath : (buildPath + "/")
  var date = Date.now()
  var files = await getFiles(basePath)
  files = files.filter((f)=>f.indexOf("node_modules")===-1 && f.indexOf(".zero")===-1)
  
  //console.log(basePath, files)
  var json = await Promise.all( files.map(async (file)=>{
    // check if js file is a js lambda function
    if (file.endsWith(".js")){
      
      var statusCode = await spawnAsync(validators["js"], [file])
      console.log(file, statusCode)
      if (statusCode===0){
        return [file, 'lambda:js']
      }
    }

    // check if a react component
    if (file.endsWith(".js") || file.endsWith(".jsx")){
      var statusCode = await spawnAsync(validators["react"], [file])
      console.log(file, statusCode)
      if (statusCode===0){
        return [file, 'lambda:react']
      }
    }

    // PHP Lambda
    if (file.endsWith(".php")){
      return [file, "lambda:php"]
    }

    // Python Lambda
    if (file.endsWith(".py")){
      return [file, "lambda:py"]
    }
    // catch all, static / cdn hosting
    return false // static is catch-all so no need to save it as entry in our manifest
    //return [file, 'static']
  })
  )

  console.log("elaps", (Date.now() - date)/1000 )

  
  return json
  // remove empty elements
  .filter((endpoint)=>{
    return endpoint !== false
  })
  // add endpoint path at 0 position for each lambda
  .map((endpoint)=>{
    var trimmedPath = endpoint[0].replace(basePath, "/")
    trimmedPath = trimmedPath.split('.').slice(0, -1).join('.') // remove extension
    endpoint[0] = endpoint[0].replace(basePath, buildPath)
    endpoint.unshift(trimmedPath)
    return endpoint
  })
}

module.exports = buildManifest
