const waitPort = require("wait-port");
const path = require("path");
const startServer = require("../packages/core/lib").server;
const fs = require("fs");
const http = require("http");

module.exports = async function globalSetup() {
  if (process.env.SERVER) return;
  const www = path.join(__dirname, "./www");
  // if (fs.existsSync(path.join(www, "package.json")))
  //   fs.unlinkSync(path.join(www, "package.json"));
  await startServer(www);
  startProxyServer();
  await waitPort({
    //host: "http://localhost",
    port: 3000,
    timeout: 1000 * 60 * 2 // 2 Minutes
  });
};

function startProxyServer() {
  const port = 3123;
  const requestHandler = (request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        path: request.url
      })
    );
  };
  const server = http.createServer(requestHandler);
  server.listen(port, err => {
    if (err) {
      return console.log("something bad happened", err);
    }
  });
  return server;
}
