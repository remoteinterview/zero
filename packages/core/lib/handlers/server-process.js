// child process to run given lambda server
var dt = Date.now()
function log(str){ console.log (str, Date.now()-dt); dt = Date.now()}
const path = require("path"),
      http = require("http"),
      url = require("url"),
      handlers = require("./index"),
      Youch = require('youch'),
      express = require('express')
const FETCH = require('@zeit/fetch')()

const GLOBALS = require("./globals")

log("imports")

const vm = require('vm');



if (!process.argv[2]) throw new Error("No entry file provided.")
if (!process.argv[3]) throw new Error("No lambda type provided.")
if (!process.argv[4]) throw new Error("Server port not provided.")

// get handler
const handler = handlers[process.argv[3]]
startServer(process.argv[2], process.argv[3], handler).then((port)=>{
  process.send(port)
  log("port sent")
})

function generateFetch(req){
  return function fetch(uri, options){
    // fix relative path when running on server side.
    if (uri && uri.startsWith("/")){
      // TODO: figure out what happens when each lambda is running on multiple servers.
      // TODO: figure out how to forward cookies (idea: run getInitialProps in a VM with modified global.fetch that has 'req' access and thus to cookies too)
      uri = url.resolve("http://localhost:"+process.argv[4], uri)
    }
    return FETCH(uri, options)
  }
}
function startServer(entryFile, lambdaType, handler){
  return new Promise((resolve, reject)=>{
    const file = path.resolve(entryFile)
    const app = express()

    app.all("*", (req, res)=>{
      try{
        //console.log("TRYING", file, typeof handler)
        var globals = Object.assign({__Zero: {req, res, lambdaType, handler, file, renderError, fetch: generateFetch(req)}}, GLOBALS);
  
        vm.runInNewContext(`
          const { req, res, lambdaType, file, fetch, handler, renderError } = __Zero;
          global.fetch = fetch
          // require("./index")[lambdaType](req, res, file)
          async function run(){ 
            try{
              if (handler) await handler(req, res, file) 
            }
            catch(e){
              renderError(e, req, res)
            }
          }
          run()
        `, globals)
      }
      catch(error){
        //res.write("ERROR")
        console.log("CATCH", error)
        renderError(error, req, res)
      }
    })
    // app.get('/', (req, res) => res.send('Hello World!'))
  
    var listener = app.listen(0, "127.0.0.1", () => {
      console.log("listening ", lambdaType, listener.address().port)
      resolve(listener.address().port)
    })
  })
}

async function renderError(error, req, res){
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