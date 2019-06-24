var request = require("request-promise-native");
var url = require("url");
var server = process.env.SERVER || "http://localhost:3000/";
function makeRequest(path, options) {
  options = options || {};

  options.uri = url.resolve(server, path);
  options.timeout = 1000 * 60 * 2; // 2 Minutes
  return request(options);
}

module.exports = {
  get: makeRequest,
  jar: request.jar
};
