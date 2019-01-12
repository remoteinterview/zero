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

async function buildManifest(buildPath, oldManifest, fileFilter) {
  //basePath = basePath.endsWith("/") ? basePath : (basePath + "/")
  buildPath = buildPath.endsWith("/") ? buildPath : (buildPath + "/")
  var date = Date.now()
  var files = await getFiles(buildPath)
  files = files.filter((f) => f.indexOf("node_modules") === -1 && f.indexOf(".zero") === -1)

  //console.log(basePath, files)
  var json = await Promise.all(files.map(async (file, i) => {

    // if old manifest is given and a file filter is given, we skip those not in filter
    if (oldManifest && fileFilter && fileFilter.length>0){
      var normalizedFile = file//.replace(basePath, buildPath)
      if (fileFilter.indexOf(normalizedFile)===-1){
        var endpoint = oldManifest.lambdas.find((lambda)=>{
          return lambda[1]===normalizedFile
        })
        console.log("skipping", normalizedFile, !!endpoint)
        if (endpoint) return [file, endpoint[2]]
        else return false
      }
    }
    // first check if filename (or the folder it resides in) begines with underscore _. ignore those.
    var ignore = file.replace(buildPath, "").split("/").find((dirname => dirname.startsWith("_")))
    if (ignore) return false

    // check if js file is a js lambda function
    if (file.endsWith(".js")) {

      var statusCode = await spawnAsync(validators["js"], [file])
      console.log(file, statusCode, 'js')
      if (statusCode === 0) {
        return [file, 'lambda:js']
      }
    }

    // check if a react component
    if (file.endsWith(".js") || file.endsWith(".jsx")) {
      var statusCode = await spawnAsync(validators["react"], [file])
      console.log(file, statusCode, 'react')
      if (statusCode === 0) {
        return [file, 'lambda:react']
      }
    }

    // PHP Lambda
    if (file.endsWith(".php")) {
      return [file, "lambda:php"]
    }

    // Python Lambda
    if (file.endsWith(".py")) {
      return [file, "lambda:py"]
    }
    // catch all, static / cdn hosting
    //return [file, 'static']
    return false
  })
  )

  console.log("elaps", (Date.now() - date) / 1000)


  var lambdas = json
    // remove empty elements
    .filter((endpoint) => {
      return endpoint !== false
    })
    // add endpoint path at 0 position for each lambda
    .map((endpoint) => {
      var trimmedPath = endpoint[0].replace(buildPath, "/")
      //if (endpoint[1]!=="static" 
        //  || (trimmedPath.endsWith(".html") || trimmedPath.endsWith(".htm")) ){
        trimmedPath = trimmedPath.split('.').slice(0, -1).join('.') // remove extension
        if (trimmedPath.endsWith("/index")) {
          trimmedPath = trimmedPath.split('/index').slice(0, -1).join('/index') // remove extension
        }
      //}
      //endpoint[0] = endpoint[0].replace(basePath, buildPath)
      endpoint.unshift(trimmedPath)
      return endpoint
    })

    lambdas = lambdas.map((endpoint) => {
    endpoint.push( [endpoint[1]].concat(dependancyTree(buildPath, endpoint[1])) )
    return endpoint
  })

  var fileToLambdas = {}
  lambdas.forEach((endpoint, i)=>{
    endpoint[3].forEach((file)=>{
      fileToLambdas[file] = fileToLambdas[file] || []
      fileToLambdas[file].push(endpoint[1])
    })
  })

  return {lambdas, fileToLambdas}
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
