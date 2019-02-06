// child process to run given lambda server
var dt = Date.now()
// function log(str){ debug (str, Date.now()-dt); dt = Date.now()}
const path = require("path"),
      http = require("http"),
      url = require("url"),
      //handlers = require("./handlers"),
      Youch = require('youch'),
      express = require('express')
const FETCH = require('node-fetch')
const debug = require('debug')('core')

const GLOBALS = require("./globals")
// log("imports")

const vm = require('vm');
var passport = require('passport');
passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user));
})

passport.deserializeUser(function(id, done) {
  done(null, JSON.parse(id))
})
var SESSION_TTL = parseInt(process.env.SESSION_TTL)


var session = require('express-session')
var FileStore = require('session-file-store')(session)
// TODO: handle mongo and redis stores.
var sessionStore = new FileStore({
  path: path.join(require('os').tmpdir(), "zero-sessions"),
  ttl: SESSION_TTL
})

if (!process.argv[2] && process.argv[2]!=="") throw new Error("No basePath provided.")
if (!process.argv[3]) throw new Error("No entry file provided.")
if (!process.argv[4]) throw new Error("No lambda type provided.")
if (!process.argv[5]) throw new Error("Server address not provided.")
if (!process.argv[6]) throw new Error("Lambda ID not provided.")

var BASEPATH = process.argv[2]
var SERVERADDRESS = process.argv[5]

// let the lambda save it's bundle files in BUILDPATH/LambdaID folder
var BUNDLEPATH = process.argv[6]
debug("Server Address", SERVERADDRESS, "BundlePath", BUNDLEPATH)
// get handler
//const handler = handlers[process.argv[4]]
startServer(process.argv[3], process.argv[4]/*, handler*/).then((port)=>{
  if (process.send) process.send(port)
  else console.log("PORT", port)
  // log("port sent")
})

function generateFetch(req){
  return function fetch(uri, options){
    // fix relative path when running on server side.
    if (uri && uri.startsWith("/")){
      // TODO: figure out what happens when each lambda is running on multiple servers.
      // TODO: figure out how to forward cookies (idea: run getInitialProps in a VM with modified global.fetch that has 'req' access and thus to cookies too)
      uri = url.resolve(SERVERADDRESS, uri)
    }
    debug("fething", uri, options, SERVERADDRESS)
    return FETCH(uri, options)
  }
}
function startServer(entryFile, lambdaType/*, handler*/){
  return new Promise((resolve, reject)=>{
    const file = path.resolve(entryFile)
    const app = express()

    app.use(require('cookie-parser')());
    app.use(require('body-parser').urlencoded({ extended: true }));
    app.use(require('body-parser').json());
    // debug("tempdir", SESSION_TTL, path.join(require('os').tmpdir(), "zero-sessions"))

    app.use(session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET, 
      resave: false, 
      cookie: { maxAge : SESSION_TTL },
      saveUninitialized: false 
    }))

    // Initialize Passport and restore authentication state, if any, from the
    // session.
    app.use(passport.initialize());
    app.use(passport.session());
    app.all([BASEPATH, url.resolve(BASEPATH, "/*")], (req, res)=>{
      // if path has params (like /user/:id/:comment). Split the params into an array.
      // also remove empty params (caused by path ending with slash)
      if (req.params && req.params[0]){
        req.params = req.params[0].replace(BASEPATH.slice(1), "").split("/").filter((param)=> !!param)
      }
      try{
        //debug("TRYING", file, typeof handler)
        var globals = Object.assign({__Zero: {app, req, res, lambdaType, BUNDLEPATH, file, renderError, fetch: generateFetch(req)}}, GLOBALS);
  
        vm.runInNewContext(`
          const { app, req, res, lambdaType, file, fetch, renderError, BUNDLEPATH } = __Zero;
          global.fetch = fetch
          global.app = app
          var handlerModule = require("./handlers")[lambdaType]
          var handler = require(handlerModule).handler
          process.on('unhandledRejection', (reason, p) => {
            renderError(reason, req, res)
          })

          handler(req, res, file, BUNDLEPATH)
          
          
        `, globals)
      }
      catch(error){
        renderError(error, req, res)
      }
    })
    // app.get('/', (req, res) => res.send('Hello World!'))
  
    var listener = app.listen(0, "127.0.0.1", () => {
      debug("listening ", lambdaType, listener.address().port)
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