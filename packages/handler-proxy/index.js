module.exports = {
  process: require.resolve("./process.js"),
  handler: require("./process.js"),
  config: {
    restartOnFileChange: true
  }
};
