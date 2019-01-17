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
const fetch = require("node-fetch")
const debug = require('debug')('core')
const ora = require('ora');

var lambdaIdToPortMap = {}

async function proxyLambdaRequest(req, res, endpointData){
  const spinner = ora({
    color: 'green',
    spinner: "star"
  })
  if (!lambdaIdToPortMap[endpointData[1]]){
    spinner.start("Building " + endpointData[0])
  }

  const port = await getLambdaServerPort(endpointData, spinner)
  debug("req", endpointData[1], port)
  var lambdaAddress = "http://127.0.0.1:"+port
  const proxyRes = await fetch(lambdaAddress + req.url, {
    method: req.method,
    headers: Object.assign({ 'x-forwarded-host': req.headers.host }, req.headers),
    body: req.body,
    compress: false,
    redirect: 'manual',
    //credentials: "include"
  })

  if (spinner.isSpinning){
    spinner.succeed(endpointData[0] + " ready")
  }

  // Forward status code
  res.statusCode = proxyRes.status

  // Forward headers
  const headers = proxyRes.headers.raw()
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase()==="location" && headers[key]){
      headers[key] = headers[key][0].replace(lambdaAddress, process.env.SERVERADDRESS)
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

  // req.on('end', ()=>{
  //   debug("closed")
  // })
}


function getLambdaServerPort(endpointData){
  return new Promise((resolve, reject)=>{
    const entryFilePath = endpointData[1]
    if (lambdaIdToPortMap[entryFilePath]) return resolve(lambdaIdToPortMap[entryFilePath].port)
    const fork = require('child_process').fork;
    const program = path.resolve(path.join(__dirname, "./server-process.js"));
    const parameters = [endpointData[0], endpointData[1], endpointData[2], process.env.SERVERADDRESS];
    const options = {
      stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
    };

    const child = fork(program, parameters, options);

    // child server sends port via IPC
    child.on('message', message => {
      debug("got Port for", entryFilePath, message)
      lambdaIdToPortMap[entryFilePath] = {port: parseInt(message), process: child}
      resolve(lambdaIdToPortMap[entryFilePath].port)
      //if (spinner) spinner.succeed(endpointData[0] + " ready")
    })

    child.on('error', (err) => {
      debug('Failed to start subprocess.', err);
      delete lambdaIdToPortMap[entryFilePath]
    });
    child.on('close', () => {
      debug('subprocess stopped.');
      delete lambdaIdToPortMap[entryFilePath]
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
      filesUpdated.forEach(file=>{
        if (lambdaIdToPortMap[file]) {
          debug("killing", file, lambdaIdToPortMap[file].port)
          lambdaIdToPortMap[file].process.kill() 
          // start the process again
          var endpointData = newManifest.lambdas.find((lambda)=>{
            return lambda[1]===file
          })

          delete lambdaIdToPortMap[file]
          debug("starting", endpointData)
          if (endpointData) getLambdaServerPort(endpointData)
        }
      })
    }
    else{
      // kill all servers
      for (var file in lambdaIdToPortMap){
        //debug("killing", lambdaIdToPortMap[i].port)
        lambdaIdToPortMap[file].process.kill()
      }
    }
  }
}


