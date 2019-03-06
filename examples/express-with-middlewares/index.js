const app = require('express')()

// define or import your express middlwares.
var logOriginalUrl = function (req, res, next) {
  console.log('url', req.originalUrl)
  next()
}

var logMethod = function (req, res, next) {
  console.log('method', req.method)
  next()
}

// add them to app as middleware
app.use([logOriginalUrl, logMethod])

// finally, the route handler for this path
app.use((req, res)=>{
  res.send("Hello")
})

// export the entire express app.
module.exports = app