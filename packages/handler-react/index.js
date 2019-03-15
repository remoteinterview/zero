module.exports = {
  process: require.resolve("./process.js"),
  config: {
    // in dev mode, we just restart the handler (not bundler, parcel provides HMR)
    restartOnFileChange: true
    //restartBundlerOnFileChange: process.env.NODE_ENV === 'production'
  }
};
