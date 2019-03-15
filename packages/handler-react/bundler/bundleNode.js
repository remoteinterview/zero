// this wrapper process just runs the same bundler with target node option

const bundle = require("./bundle");
bundle(
  process.argv[2],
  process.argv[3],
  process.argv[3],
  process.argv[4],
  true
).then(bundler => {
  function cleanProcess(method) {
    process.exit();
  }
  process.on("exit", cleanProcess.bind(this, "exit"));
  process.on("SIGTERM", cleanProcess.bind(this, "SIGTERM"));

  process.send("ok");
});
