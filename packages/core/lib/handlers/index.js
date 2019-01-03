module.exports = {
  "static": require("zero-static").handler,
  "lambda:js": require("zero-lambda-js").handler,
  "lambda:react": require("zero-lambda-react").handler
}