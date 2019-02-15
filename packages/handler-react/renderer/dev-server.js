var http = require('http');
var express = require('express')

//CORS middleware
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}


module.exports = ()=>{
  return new Promise((resolve, reject)=>{
    var app = express();
    app.use(allowCrossDomain)

    var server = http.createServer(app);
    server.listen(0, function() {
      resolve({
        port: server.address().port, 
        updateDevMiddleware: (compiler, webpackConfig)=>{
          // Attach the dev middleware to the compiler & the server
          app.use(require("webpack-dev-middleware")(compiler, {
            logLevel: 'silent', hot: true
          }))

          // Attach the hot middleware to the compiler & the server
          app.use(require("webpack-hot-middleware")(compiler, {
            log: false, path: '/__webpack_hmr', heartbeat: 10 * 1000
          }))
        }
      })
      //console.log("Dev Server::Listening on %j", server.address().port)
    })
  })
}