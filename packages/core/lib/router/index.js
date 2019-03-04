/*
 When a user hits a url which is a lambda, the router starts a new 
 http server in a separate child process. The child process returns the port.
 The router then proxies the request to that server.
 The router also maintains a map {} to avoid creating new processes for
 same url when it's hit again.

 Static files are handled in the current process.
*/

const express = require('express')
const compression = require('compression')
const matchPath = require("./matchPath")
const staticHandler = require("zero-static").handler
const path = require('path')
const url = require("url")
const handlers = require('zero-handlers-map')
const fetch = require("node-fetch")
const fs = require('fs')
const debug = require('debug')('core')
const ora = require('ora');
const del = require('del');
const fork = require('child_process').fork;
const forkasync = require('../utils/spawn-async')
const bundlerProgram =  require.resolve("zero-bundler-process")

var lambdaIdToPortMap = {}
var lambdaIdToBundleInfo = {}
var updatedManifest = false

var getLambdaID = function(entryFile){
  return require("crypto").createHash('sha1').update(entryFile).digest('hex')
}

async function proxyLambdaRequest(req, res, endpointData){
  const spinner = ora({
    color: 'green',
    spinner: "star"
  })
  if (!process.env.SERVERADDRESS){
    process.env.SERVERADDRESS = "http://"+req.headers.host
  }
  var lambdaID = getLambdaID(endpointData[0])

  if (!lambdaIdToBundleInfo[lambdaID] && handlers[endpointData[2]].bundler){
    //debug("build not found", lambdaID, endpointData[0])
    spinner.start("Building " + url.resolve("/", endpointData[0]))
    await getBundleInfo(endpointData)
  }
  spinner.start("Serving " + url.resolve("/", endpointData[0]))

  var serverAddress = process.env.SERVERADDRESS

  const port = await getLambdaServerPort(endpointData)
  debug("req", endpointData[1], port, req.method, req.body)
  
  //debug("server address", serverAddress)
  var lambdaAddress = "http://127.0.0.1:"+port
  var options = {
    method: req.method,
    headers: Object.assign({ 'x-forwarded-host': req.headers.host }, req.headers),
    compress: false,
    redirect: 'manual',
    //credentials: "include"
  }
  if (req.method.toLowerCase()!=="get" && req.method.toLowerCase()!=="head"){
    options.body = req
  }
  const proxyRes = await fetch(lambdaAddress + req.url, options)

  if (spinner.isSpinning){
    spinner.succeed(url.resolve("/", endpointData[0]) + " ready")
  }

  // Forward status code
  res.statusCode = proxyRes.status

  // Forward headers
  const headers = proxyRes.headers.raw()
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase()==="location" && headers[key]){
      headers[key] = headers[key][0].replace(lambdaAddress, serverAddress)
    }
    res.setHeader(key, headers[key])
  }
  res.setHeader("x-powered-by", "ZeroServer")

  // Stream the proxy response
  proxyRes.body.pipe(res)
  proxyRes.body.on('error', (err) => {
    console.error(`Error on proxying url: ${newUrl}`)
    console.error(err.stack)
    res.end()
  })

  req.on('abort', () => {
    proxyRes.body.destroy()
  })
}

// if server exits, kill the child processes too.
process.on('exit', () => {
  for (var id in lambdaIdToPortMap){
    lambdaIdToPortMap[id].process.kill()
  }

  for (var id in lambdaIdToBundleInfo){
    if (lambdaIdToBundleInfo[id].process) lambdaIdToBundleInfo[id].process.kill()
  }
})


function getBundleInfo(endpointData){
  return new Promise(async (resolve, reject)=>{
    const entryFilePath = endpointData[1]
    const lambdaID = getLambdaID(endpointData[0])
    if (lambdaIdToBundleInfo[lambdaID]) return resolve(lambdaIdToBundleInfo[lambdaID])
    
    if (!bundlerProgram) return resolve(false)
    const parameters = [endpointData[0], endpointData[1], endpointData[2], "zero-builds/" + lambdaID];
    const options = {
      stdio: [ 0, 1, 2, 'ipc' ]
    };

    const child = fork(bundlerProgram, parameters, options);
    child.on('message', message => {
      lambdaIdToBundleInfo[lambdaID] = {info: message, process: child}
      return resolve( lambdaIdToBundleInfo[lambdaID] )
    })

    child.on('close', ()=>{
      delete lambdaIdToBundleInfo[lambdaID]
    })
    // child.stdout.on('data', (data) => {
    //   console.log(`${data}`)
    // });
    
    // child.stderr.on('data', (data) => {
    //   console.error(`${data}`)
    // });
  })
}

function getLambdaServerPort(endpointData){
  return new Promise((resolve, reject)=>{
    const entryFilePath = endpointData[1]
    const lambdaID = getLambdaID(endpointData[0])
    if (lambdaIdToPortMap[lambdaID]) return resolve(lambdaIdToPortMap[lambdaID].port)
    const program =  handlers[endpointData[2]].process
    const parameters = [endpointData[0], endpointData[1], endpointData[2], process.env.SERVERADDRESS, "zero-builds/" + lambdaID, lambdaIdToBundleInfo[lambdaID]?lambdaIdToBundleInfo[lambdaID].info:""];
    const options = {
      stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
    };

    const child = fork(program, parameters, options);

    child.stdout.on('data', (data) => {
      console.log(`${data}`)
    });
    
    child.stderr.on('data', (data) => {
      console.error(`${data}`)
    });
    
    // child server sends port via IPC
    child.on('message', message => {
      debug("got Port for", entryFilePath, message)
      lambdaIdToPortMap[lambdaID] = {port: parseInt(message), process: child, endpointData: endpointData}
      resolve(lambdaIdToPortMap[lambdaID].port)
      //if (spinner) spinner.succeed(endpointData[0] + " ready")
    })

    child.on('error', (err) => {
      debug('Failed to start subprocess.', err);
      del(path.join(process.env.BUILDPATH, "zero-builds", lambdaID, "/**"), {force: true})
      delete lambdaIdToPortMap[lambdaID]
    });
    child.on('close', (e) => {
      debug('subprocess stopped.', e);
      del(path.join(process.env.BUILDPATH, "zero-builds", lambdaID, "/**"), {force: true})
      delete lambdaIdToPortMap[lambdaID]
    });

    
  })
}

// a promise to keep waiting until manifest is available.
function waitForManifest(){
  return new Promise((resolve, reject)=>{
    var interval = setInterval(()=>{
      if (updatedManifest) {
        clearInterval(interval)
        resolve()
      }
    }, 1000)
  })
}

module.exports = (buildPath)=>{
  const app = express()

  // compress all responses
  app.use(compression({threshold: 1}))

  var manifest = {lambdas:[], fileToLambdas:{}}
  var forbiddenStaticFiles = []
  app.all("*", async (request, response)=>{
    // don't serve requests until first manifest is available
    if (!updatedManifest) await waitForManifest()

    var endpointData = matchPath(manifest, forbiddenStaticFiles, buildPath, request.url)
    debug("match", request.url, endpointData)
    if (endpointData){
      // call relevant handler as defined in manifest
      return proxyLambdaRequest(request, response, endpointData)
    }
    // catch all handler
    return staticHandler(request, response)
  })

  var listener = app.listen(process.env.PORT, () => {
    debug("Running on port", listener.address().port)
  })

  return (newManifest, newForbiddenFiles, filesUpdated)=>{
    debug("updating manifest in server")
    manifest = newManifest;
    forbiddenStaticFiles = newForbiddenFiles

    if (!updatedManifest){
      // this is first update of manifest
      updatedManifest = true

      // try to load build-info from file (if generated using 'zero build' command)
      try{
        var file = fs.readFileSync(path.join(buildPath, "/zero-builds/build-info.json"), 'utf8')
        lambdaIdToBundleInfo = JSON.parse(file)
        //console.log("loading build info with ", Object.keys(lambdaIdToBundleInfo).length, "keys")
      }
      catch(e){
        // file is probably not present, ignore
      }
    }

    // kill and restart servers 
    if (filesUpdated){

      // find out which lambdas need updating due to this change
      var lambdasUpdated = {}
      filesUpdated.forEach(file=>{
        var lambdaEntryFiles = manifest.fileToLambdas[file]
        if (!lambdaEntryFiles || lambdaEntryFiles) return;
        lambdaEntryFiles.forEach((file)=> lambdasUpdated[file] = true)
      })

      // update each lambda
      Object.keys(lambdasUpdated).forEach(async (lambdaEntryFile)=>{
        var lambdaID = getLambdaID(lambdaEntryFile)
        if (lambdaIdToPortMap[lambdaID] && shouldKillOnChange(lambdaIdToPortMap[lambdaID].endpointData)) {
          debug("killing", lambdaEntryFile, lambdaIdToPortMap[lambdaID].port)
          lambdaIdToPortMap[lambdaID].process.kill()
          // delete their bundle if any
          await del(path.join(process.env.BUILDPATH, "zero-builds", lambdaID, "/**"), {force: true})

          // start the process again
          var endpointData = newManifest.lambdas.find((lambda)=>{
            return lambda[1]===lambdaEntryFile
          })

          // generate bundle
          delete lambdaIdToBundleInfo[lambdaID]
          await getBundleInfo(endpointData)

          delete lambdaIdToPortMap[lambdaID]
          debug("starting", endpointData)
          if (endpointData) getLambdaServerPort(endpointData)
        }
      })
    }
    else{
      // kill all servers
      for (var file in lambdaIdToPortMap){
        //debug("killing", lambdaIdToPortMap[i].port)
        lambdaIdToPortMap[getLambdaID(file)].process.kill()
      }
    }
  }
}

function shouldKillOnChange(endpointData){
  // get config for this lambda type and see if we 
  // should restart the process or will the handler manage itself (hmr etc)
  const config = handlers[endpointData[2]]? handlers[endpointData[2]].config : false
  if (config){
    if (config.restartOnFileChange===false) return false
  }

  // no config, default to killing
  return true
}
