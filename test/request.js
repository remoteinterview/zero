var request = require('request-promise-native');
var url = require("url")

function makeRequest(path, options){
  options = options || {}
  options.uri = url.resolve("http://localhost:3000/", path)
  options.timeout = 1000 * 60 * 2 // 2 Minutes
  return request(options)
}

module.exports = {
  get: makeRequest,
  jar: request.jar
}