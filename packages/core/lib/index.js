/*
User can either run the server ie. `zero <folder>` (either in dev or prod mode)
or just build the project ie. `zero build` (likely before deploying)
 */
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
