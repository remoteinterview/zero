module.exports = {
  process: require.resolve("./process.js"),
  config: {
    // in dev mode, parcel provides HMR
    restartOnFileChange: process.env.NODE_ENV==="production"
  }
}