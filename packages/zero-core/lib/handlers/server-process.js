// child process to run given lambda server

const path = require("path"),
      http = require("http"),
      handlers = require("./index")

if (process.send) {
  process.send("ready");
}

console.log("started process")
process.on('message', message => {
  console.log('message from parent:', message);
  // endpointData is (path, entryFile, lambdaType) 
  // example: [ '/react/class', '/example/.zero/react/class.js', 'lambda:react' ]
  var endpointData = JSON.parse(message)
  // get handler
  const handler = handlers[endpointData[2]]
  startServer(endpointData, handler).then((port)=>{
    process.send(port)
  })
})

async function startServer(endpointData, handler){
  const file = path.resolve(endpointData[1])
  // start a server on random port and bind to localhost
  const server = http.createServer((req, res)=>{
    if (handler) handler(req, res, file)
  })
  await server.listen(0, "127.0.0.1")
  console.log("listening ", endpointData[2], server.address().port)
  //lambdaToPortMap[entryFilePath] = server.address().port
  return server.address().port
}