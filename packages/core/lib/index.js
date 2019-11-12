const build = require("./build");
const server = require("./server");

process.on("SIGINT", function() {
  //graceful shutdown
  process.exit();
});

module.exports = {
  server: server,
  build: build
};
