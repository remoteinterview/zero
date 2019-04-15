const waitPort = require("wait-port");
const path = require("path");
const startServer = require("../packages/core/lib").server;
const fs = require("fs");

module.exports = async function globalSetup() {
  const www = path.join(__dirname, "./www");
  fs.unlinkSync(path.join(www, "package.json"));
  await startServer(www);

  await waitPort({
    //host: "http://localhost",
    port: 3000,
    timeout: 1000 * 60 * 2 // 2 Minutes
  });
};
