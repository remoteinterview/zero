module.exports = {
  process: require.resolve("./process.js"),
  bundler: require("./bundler"),
  getRelatedFiles: require("zero-dep-tree-js").getRelativeFiles,
  config: {
    // in dev mode, we just restart the handler (not bundler, parcel provides HMR)
    restartOnFileChange: true,
    //restartBundlerOnFileChange: process.env.NODE_ENV === 'production'
  }
}