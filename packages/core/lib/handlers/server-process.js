// child process to run given lambda server
var dt = Date.now()
function log(str){ console.log (str, Date.now()-dt); dt = Date.now()}
const path = require("path"),
      http = require("http"),
      url = require("url"),
      handlers = require("./index"),
      Youch = require('youch')
const FETCH = require('@zeit/fetch')()

log("imports")
// if (process.send) {
//   process.send("ready");
// }

if (!process.argv[2]) throw new Error("No entry file provided.")
if (!process.argv[3]) throw new Error("No lambda type provided.")
if (!process.argv[4]) throw new Error("Server port not provided.")
//var endpointData = JSON.parse(message)
// get handler
const handler = handlers[process.argv[3]]
startServer(process.argv[2], process.argv[3], handler).then((port)=>{
  process.send(port)
  log("port sent")
})
/*
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
*/

function fetch(uri, options){
  // fix relative path when running on server side.
  if (uri && uri.startsWith("/")){
    // TODO: figure out what happens when each lambda is running on multiple servers.
    // TODO: figure out how to forward cookies (idea: run getInitialProps in a VM with modified global.fetch that has 'req' access and thus to cookies too)
    uri = url.resolve("http://localhost:"+process.argv[4], uri)
  }
  //console.log("fetch", uri)
  return FETCH(uri, options)
}
global.fetch = fetch

async function startServer(entryFile, lambdaType, handler){
  const file = path.resolve(entryFile)
  // start a server on random port and bind to localhost
  const server = http.createServer(async (req, res)=>{
    
    req.on('end', ()=>{
      //console.log("closed")
      //process.exit()
    })
    try{
      //console.log("TRYING", file, typeof handler)
      if (handler) await handler(req, res, file)
      else throw new Error("No handler available for this type of lambda.")
    }
    catch(error){
      //res.write("ERROR")
      //console.log("CATCH", error)
      const youch = new Youch(error, req)
      
      var html = await 
      youch.addLink(({ message }) => {
        var style = `text-decoration: none; border: 1px solid #dcdcdc; padding: 9px 12px;`
        const urlStack = `https://stackoverflow.com/search?q=${encodeURIComponent(`${message}`)}`
        const urlGoogle = `https://www.google.com/search?q=${encodeURIComponent(`${message}`)}`
        return `
        <a style="${style}" href="${urlGoogle}" target="_blank" title="Search on Google">Search Google</a>
        <a style="${style}" href="${urlStack}" target="_blank" title="Search on StackOverflow">Search StackOverflow</a>
        
        `
      }).toHTML()
      res.writeHead(200, {'content-type': 'text/html'})
      res.write(html)
      res.end()
    }
  })
  await server.listen(0, "127.0.0.1")
  log("listening")
  console.log("listening ", lambdaType, server.address().port)
  //lambdaToPortMap[entryFilePath] = server.address().port
  return server.address().port
}