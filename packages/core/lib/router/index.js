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

var lambdaIdToPortMap = {}
var SERVERADDRESS = process.env.SERVERADDRESS

async function proxyLambdaRequest(req, res, endpointData){
  const port = await getLambdaServerPort(endpointData)
  console.log("req", endpointData[1], port)
  var lambdaAddress = "http://127.0.0.1:"+port
  const proxyRes = await fetch(lambdaAddress + req.url, {
    method: req.method,
    headers: Object.assign({ 'x-forwarded-host': req.headers.host }, req.headers),
    body: req.body,
    compress: false,
    redirect: 'manual',
    //credentials: "include"
  })

  // Forward status code
  res.statusCode = proxyRes.status

  // Forward headers
  const headers = proxyRes.headers.raw()
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase()==="location" && headers[key]){
      headers[key] = headers[key][0].replace(lambdaAddress, SERVERADDRESS)
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
  //   console.log("closed")
  // })
}


function getLambdaServerPort(endpointData){
  return new Promise((resolve, reject)=>{
    
    const entryFilePath = endpointData[1]
    if (lambdaIdToPortMap[entryFilePath]) return resolve(lambdaIdToPortMap[entryFilePath].port)
    const fork = require('child_process').fork;
    const program = path.resolve(path.join(__dirname, "./server-process.js"));
    const parameters = [endpointData[0], endpointData[1], endpointData[2], SERVERADDRESS];
    const options = {
      stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
    };

    const child = fork(program, parameters, options);

    // child server sends port via IPC
    child.on('message', message => {
      console.log("got Port for", entryFilePath, message)
      lambdaIdToPortMap[entryFilePath] = {port: parseInt(message), process: child}
      resolve(lambdaIdToPortMap[entryFilePath].port)
    })

    child.on('error', (err) => {
      console.log('Failed to start subprocess.', err);
      delete lambdaIdToPortMap[entryFilePath]
    });
    child.on('close', () => {
      console.log('subprocess stopped.');
      delete lambdaIdToPortMap[entryFilePath]
    });

    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    
    child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
  })
  
}

module.exports = (buildPath, SERVERADDRESS)=>{
  const app = express()
  var manifest = {lambdas:[], fileToLambdas:{}}
  var forbiddenStaticFiles = []
  app.all("*", (request, response)=>{
    var endpointData = matchPath(manifest, forbiddenStaticFiles, buildPath, request.url)
    if (endpointData){
      // call relevant handler as defined in manifest
      return proxyLambdaRequest(request, response, endpointData, SERVERADDRESS)
    }
    // catch all handler
    return staticHandler(request, response)
  })

  var listener = app.listen(process.env.PORT, () => {
    console.log("Running on port", listener.address().port)
  })

  return (newManifest, newForbiddenFiles, filesUpdated)=>{
    console.log("updating manifest in server")
    manifest = newManifest;
    forbiddenStaticFiles = newForbiddenFiles

    // kill and restart servers 
    if (filesUpdated){
      filesUpdated.forEach(file=>{
        if (lambdaIdToPortMap[file]) {
          console.log("killing", file, lambdaIdToPortMap[file].port)
          lambdaIdToPortMap[file].process.kill() 
          // start the process again
          var endpointData = newManifest.lambdas.find((lambda)=>{
            return lambda[1]===file
          })
          
          delete lambdaIdToPortMap[file]
          console.log("starting", endpointData)
          if (endpointData) getLambdaServerPort(endpointData)
        }
      })
    }
    else{
      // kill all servers
      for (var file in lambdaIdToPortMap){
        //console.log("killing", lambdaIdToPortMap[i].port)
        lambdaIdToPortMap[file].process.kill()
      }
    }
  }
}


