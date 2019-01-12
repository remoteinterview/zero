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

var lambdaToPortMap = {}
async function proxyLambdaRequest(req, res, endpointData, serverAddress){
  const port = await getLambdaServerPort(endpointData, serverAddress)
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

  // req.on('end', ()=>{
  //   console.log("closed")
  // })
}


function getLambdaServerPort(endpointData, serverAddress){
  return new Promise((resolve, reject)=>{
    
    const entryFilePath = endpointData[1]
    if (lambdaToPortMap[entryFilePath]) return resolve(lambdaToPortMap[entryFilePath].port)
    const fork = require('child_process').fork;
    const program = path.resolve(path.join(__dirname, "./server-process.js"));
    const parameters = [endpointData[0], endpointData[1], endpointData[2], serverAddress];
    const options = {
      stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
    };

    const child = fork(program, parameters, options);

    // child server sends port via IPC
    child.on('message', message => {
      lambdaToPortMap[entryFilePath] = {port: parseInt(message), process: child}
      resolve(lambdaToPortMap[entryFilePath].port)
    })

    child.on('error', (err) => {
      console.log('Failed to start subprocess.', err);
      delete lambdaToPortMap[entryFilePath]
    });
    child.on('close', () => {
      console.log('subprocess stopped.');
      delete lambdaToPortMap[entryFilePath]
    });

    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    
    child.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
  })
  
}

module.exports = (buildPath, serverAddress)=>{
  const app = express()
  app.all("*", (request, response)=>{
    var endpointData = matchPath(manifest, forbiddenStaticFiles, buildPath, request.url)
    if (endpointData){
      // call relevant handler as defined in manifest
      return proxyLambdaRequest(request, response, endpointData, serverAddress)
    }
    // catch all handler
    return staticHandler(request, response)
  })

  var listener = app.listen(process.env.PORT, () => {
    console.log("Running on port", listener.address().port)
  })

  return (newManifest, newForbiddenFiles)=>{
    console.log("updating manifest in server")
    for (var i in lambdaToPortMap){
      console.log("killing", lambdaToPortMap[i].port)
      lambdaToPortMap[i].process.kill()
    }
    manifest = newManifest;
    forbiddenStaticFiles = newForbiddenFiles
    
  }
}


