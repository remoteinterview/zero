const waitPort = require('wait-port')
const path = require("path")
const startServer = require("../packages/core/lib").server

module.exports = async function globalSetup () {
  await startServer(path.join(__dirname, "./www"))

  await waitPort({
      //host: "http://localhost",
      port: 3000,
      timeout: 1000 * 60 * 2 // 2 Minutes
  })
}