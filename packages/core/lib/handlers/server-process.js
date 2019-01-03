// child process to run given lambda server

const path = require("path"),
      http = require("http"),
      handlers = require("./index"),
      Youch = require('youch')

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
  const server = http.createServer(async (req, res)=>{
    try{
      console.log("TRYING", file, typeof handler)
      if (handler) await handler(req, res, file)
      else throw new Error("No handler available for this type of lambda.")
    }
    catch(error){
      //res.write("ERROR")
      console.log("CATCH", error)
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
  console.log("listening ", endpointData[2], server.address().port)
  //lambdaToPortMap[entryFilePath] = server.address().port
  return server.address().port
}