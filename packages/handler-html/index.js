module.exports = {
  process: require.resolve("./process.js"),
  bundler: require("./bundle"),
  config: {
    // the process only serves saved static file
    restartOnFileChange: false//process.env.NODE_ENV==="production"
  }
}