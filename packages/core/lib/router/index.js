/*
 When a user hits a url which is a lambda, the router starts a new 
 http server in a separate child process. The child process returns the port.
 The router then proxies the request to that server.
 The router also maintains a map {} to avoid creating new processes for
 same url when it's hit again.

 Static files are handled in the current process.
*/

const express = require('express')
const matchPath = require("./matchPath")
const staticHandler = require("zero-static").handler
const path = require('path')
const url = require("url")
const fetch = require("node-fetch")
const debug = require('debug')('core')
const ora = require('ora');
const del = require('del');

var lambdaIdToPortMap = {}
var getLambdaID = function(entryFile){
  return require("crypto").createHash('sha1').update(entryFile).digest('hex')
}

async function proxyLambdaRequest(req, res, endpointData){
  const spinner = ora({
    color: 'green',
    spinner: "star"
  })
  var lambdaID = getLambdaID(endpointData[1])
  if (!lambdaIdToPortMap[lambdaID]){
    spinner.start("Building " + url.resolve("/", endpointData[0]))
  }
  if (!process.env.SERVERADDRESS){
    process.env.SERVERADDRESS = "http://"+req.headers.host
  }
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
})


function getLambdaServerPort(endpointData){
  return new Promise((resolve, reject)=>{
    const entryFilePath = endpointData[1]
    const lambdaID = getLambdaID(entryFilePath)
    if (lambdaIdToPortMap[lambdaID]) return resolve(lambdaIdToPortMap[lambdaID].port)
    const fork = require('child_process').fork;
    const program = path.resolve(path.join(__dirname, "./server-process.js"));
    const parameters = [endpointData[0], endpointData[1], endpointData[2], process.env.SERVERADDRESS, "zero-builds/" + lambdaID];
    const options = {
      stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
    };

    const child = fork(program, parameters, options);

    // child server sends port via IPC
    child.on('message', message => {
      debug("got Port for", entryFilePath, message)
      lambdaIdToPortMap[lambdaID] = {port: parseInt(message), process: child}
      resolve(lambdaIdToPortMap[lambdaID].port)
      //if (spinner) spinner.succeed(endpointData[0] + " ready")
    })

    child.on('error', (err) => {
      debug('Failed to start subprocess.', err);
      del(path.join(process.env.BUILDPATH, "zero-builds", lambdaID, "/**"), {force: true})
      delete lambdaIdToPortMap[lambdaID]
    });
    child.on('close', () => {
      debug('subprocess stopped.');
      del(path.join(process.env.BUILDPATH, "zero-builds", lambdaID, "/**"), {force: true})
      delete lambdaIdToPortMap[lambdaID]
    });

    child.stdout.on('data', (data) => {
      console.log(`${data}`)
    });
    
    child.stderr.on('data', (data) => {
      console.error(`${data}`)
    });
  })
}

module.exports = (buildPath)=>{
  const app = express()
  var manifest = {lambdas:[], fileToLambdas:{}}
  var forbiddenStaticFiles = []
  app.all("*", (request, response)=>{
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

    // kill and restart servers 
    if (filesUpdated){
      filesUpdated.forEach(async file=>{
        var lambdaID = getLambdaID(file)
        if (lambdaIdToPortMap[lambdaID]) {
          debug("killing", file, lambdaIdToPortMap[lambdaID].port)
          lambdaIdToPortMap[lambdaID].process.kill()
          // delete their bundle if any
          await del(path.join(process.env.BUILDPATH, "zero-builds", lambdaID, "/**"), {force: true})
          // start the process again
          var endpointData = newManifest.lambdas.find((lambda)=>{
            return lambda[1]===file
          })

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


