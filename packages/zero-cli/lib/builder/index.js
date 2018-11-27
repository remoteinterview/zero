var glob = require("glob")
var { spawnSync } = require("child_process")

async function getFiles(baseSrc) {
  return new Promise((resolve, reject)=>{
    glob(baseSrc + '/**/*', {nodir: true}, (err, res)=>{
      if (err) return reject(err)
      resolve(res)
    });
  })
}

async function buildManifest(basePath){
  basePath = basePath.endsWith("/")? basePath : (basePath + "/")
  var files = await getFiles(basePath)
  //console.log(basePath, files)
  var json = files.map((file)=>{
    
    // check if js file is a js lambda function
    if (file.endsWith(".js")){
      var output = spawnSync(__dirname + "/validators/lambda.js", [file])
      //console.log(file, output.stdout)
      if (output.status===0){
        return [file, 'lambda:js']
      }
    }

    // check if a react component
    if (file.endsWith(".js") || file.endsWith(".jsx")){
      var output = spawnSync(__dirname + "/validators/react.js", [file])
      //console.log(file, output.stdout)
      if (output.status===0){
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
    return false
    //return [file, 'static']
  })

  //console.log(json)
  return json
  .filter((endpoint)=>{
    return endpoint !== false
  })
  .map((endpoint)=>{
    var trimmedPath = endpoint[0].replace(basePath, "/")
    trimmedPath = trimmedPath.split('.').slice(0, -1).join('.')
    endpoint.unshift(trimmedPath)
    return endpoint
  })
}

module.exports = buildManifest
