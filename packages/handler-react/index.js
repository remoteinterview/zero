module.exports = {
  process: require.resolve("./process.js"),
  bundler: require("./bundler"),
  getRelatedFiles: require("zero-dep-tree-js").getRelativeFiles,
  config: {
    // in dev mode, parcel provides HMR
    restartOnFileChange: process.env.NODE_ENV==="production"
  }
}