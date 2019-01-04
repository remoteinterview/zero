const glob = require("glob")
const konan = require('konan')
const fs = require("fs")
const path = require('path')
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
    // first check if filename (or the folder it resides in) begines with underscore _. ignore those.
    var ignore = file.replace(basePath, "").split("/").find((dirname=>dirname.startsWith("_")))
    if (ignore) return false

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

  
  var manifest = json
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

  manifest = manifest.map((endpoint)=>{
    endpoint.push(dependancyTree(buildPath, endpoint[1]))
    return endpoint
  })

  return manifest
}

// recursively generate list of (relative) files imported by given file
function dependancyTree(buildPath, file){
  buildPath = buildPath || process.cwd()
  var deps = []
  if (!fs.existsSync(file, 'utf8')) return deps

  // js based files
  if (file.endsWith(".js") || file.endsWith(".jsx")){
    var imports = konan(fs.readFileSync(file, 'utf8'))
    // only strings for now.
    imports.strings.forEach((imp)=> {
      // skip package imports
      if (imp.startsWith(".")) {
        // some imports dont have extension. We got to handle those
        if (path.extname(imp)){
          deps.push(path.join(path.dirname(file), imp ))
        }
        else{
          var baseName = path.join(path.dirname(file), imp)
          if ( fs.existsSync( baseName + ".js") ) deps.push(baseName + ".js")
          else if ( fs.existsSync( baseName + ".jsx") ) deps.push(baseName + ".jsx")
          else if ( fs.existsSync( baseName + ".json") ) deps.push(baseName + ".json")
        }
      }
    })
  }
  deps.forEach((dep)=>{
    deps = deps.concat(dependancyTree(buildPath, dep ))
  })
  return deps
}

module.exports = buildManifest
