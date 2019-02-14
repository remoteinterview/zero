var http = require('http');
var express = require('express')
// module.exports = (compiler, webpackConfig)=>{
//   return new Promise((resolve, reject)=>{
//     var app = express();

//     // Attach the dev middleware to the compiler & the server
//     app.use(require("webpack-dev-middleware")(compiler, {
//       logLevel: 'warn', publicPath: webpackConfig.output.publicPath
//     }))

//     // Attach the hot middleware to the compiler & the server
//     app.use(require("webpack-hot-middleware")(compiler, {
//       log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000
//     }))

//     var server = http.createServer(app);
//     server.listen(8080, function() {
//       resolve(server.address().port)
//       console.log("Dev Server::Listening on %j", server.address().port)
//     })
//   })
// }

module.exports = (compiler, webpackConfig)=>{
    /**
   * This file runs a webpack-dev-server, using the API.
   *
   * For more information on the options passed to WebpackDevServer,
   * see the webpack-dev-server API docs:
   * https://github.com/webpack/docs/wiki/webpack-dev-server#api
   */
  const WebpackDevServer = require('webpack-dev-server');
  const server = new WebpackDevServer(compiler, {
    hot: true,
    filename: webpackConfig.output.filename,
    publicPath: "/",
    stats: {
      colors: true,
    },
  });
  server.listen(8080, 'localhost', function() {});
}