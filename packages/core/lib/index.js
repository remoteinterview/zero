const staticHandler = require("zero-static").handler
const http = require('http');
const build = require("./builder")
const path = require("path");
const url = require("url");
const fetch = require('node-fetch')
var Manifest = []
const express = require('express')

process.env.PORT = process.env.PORT || 3000
var serverAddress = "http://127.0.0.1:"+process.env.PORT
// session and auth helpers
// var passport = require('passport');
// var Strategy = require('passport-local').Strategy;
// var USERS = {} // TODO: a more permanent session store 
// passport.serializeUser(function(user, done) {
//   var sessionId = user.id || user.username || user.email
//   USERS[sessionId] = user
//   done(null, sessionId);
// });

// passport.deserializeUser(function(id, done) {
//   done(null, USERS[id])
// });


build().then((manifest)=>{
  Manifest = manifest
})

// const server = http.createServer((request, response) => {
//   //console.log(request.url)
//   var endpointData = matchPathWithDictionary(request.url)
//   if (endpointData){
//     // call relevant handler as defined in manifest
//     return proxyLambdaRequest(request, response, endpointData)
//     // if (handlers[endpointData[2]]){
//     //   return handlers[endpointData[2]](request, response, endpointData)
//     // }
//   }

//   // catch all handler
//   return staticHandler(request, response, endpointData)
// })


var lambdaToPortMap = {}
async function proxyLambdaRequest(req, res, endpointData){
  const port = await startLambdaServer(endpointData)
  // console.log("req", endpointData[1], port)
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

function startLambdaServer(endpointData){
  return new Promise((resolve, reject)=>{
    
    const entryFilePath = endpointData[1]
    if (lambdaToPortMap[entryFilePath]) return resolve(lambdaToPortMap[entryFilePath])
    const fork = require('child_process').fork;
    const program = path.resolve(path.join(__dirname, "handlers/server-process.js"));
    const parameters = [endpointData[1], endpointData[2], serverAddress];
    const options = {
      stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
    };

    //console.log("lambdaServerINIT", endpointData[0], program)

    const child = fork(program, parameters, options);
    
    child.on('message', message => {
      // console.log('message from child:', message);
      // if (message==="ready"){
      //   return child.send(JSON.stringify(endpointData))
      // }
      lambdaToPortMap[entryFilePath] = parseInt(message)
      // child.send('Hi');
      resolve(lambdaToPortMap[entryFilePath])
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


const app = express()
// app.use(require('cookie-parser')());
// app.use(require('body-parser').urlencoded({ extended: true }));
// app.use(require('express-session')({ secret: process.env.SESSION_SECRET || 'keyboard cat', resave: false, saveUninitialized: false }));

// // Initialize Passport and restore authentication state, if any, from the
// // session.
// app.use(passport.initialize());
// app.use(passport.session());

app.all("*", (request, response)=>{

  //console.log(request.url)
  var endpointData = matchPathWithDictionary(request.url)
  if (endpointData){
    // call relevant handler as defined in manifest
    return proxyLambdaRequest(request, response, endpointData)
    // if (handlers[endpointData[2]]){
    //   return handlers[endpointData[2]](request, response, endpointData)
    // }
  }

  // catch all handler
  return staticHandler(request, response, endpointData)
})

var listener = app.listen(process.env.PORT, "127.0.0.1", () => {
  console.log("Running on port", listener.address().port)
})
// server.listen(process.env.PORT, () => {
//   console.log('Running at http://localhost:3000');
// });



const stripTrailingSlash = (str) => {
  return str.replace(/^(.+?)\/*?$/, "$1");
};

function matchPathWithDictionary(path){
  path = url.parse(path).pathname
  path = stripTrailingSlash(path)

  var match = Manifest.find((endpoint)=>{
    console.log("matching", path, endpoint[0])

    // check for exact math
    return (endpoint[0] === path || endpoint[0] === path+"/index")
    
  })

  if (!match){
    // check for partial match now ie. query is: /login/username and endpoint will be /login
    // reverse sort to have closest/deepest match at [0] ie. [ "/login/abc/def", "/login/abc", "/login" ]
    var matches = Manifest.filter((endpoint) => {
      return path.startsWith(endpoint[0])
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