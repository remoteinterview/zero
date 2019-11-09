const os = require("os");
var { fork } = require("child_process");
var yarnPath = require.resolve("yarn/bin/yarn.js");
const debug = require("debug")("core");
var path = require("path");

function runYarn(cwd, args, resolveOutput) {
  const isWin = os.platform() === "win32";

  return new Promise((resolve, reject) => {
    debug("yarn", yarnPath, args, cwd);
    var child = fork(yarnPath, args || [], {
      cwd: cwd,
      stdio: !resolveOutput ? "inherit" : "pipe"
    });
    if (isWin) {
      // a windows bug. need to press enter sometimes
      try {
        // process.stdin.write("\n");
        // process.stdin.end();
      } catch (e) {}
    }

    var output = "";
    if (resolveOutput) {
      child.stdout.on("data", data => {
        output += data;
      });
    }

    child.on("exit", code => {
      debug("yarn completed");
      resolve(output);
    });
  });
}

function resolveYarn() {
  var yPath;
  try {
    var p = require.resolve("yarn/bin/yarn");
    if (p) {
      yPath = path.dirname(p);
    }
  } catch (e) {}

  // fallback
  if (!yPath) {
    yPath = path.join(__dirname, "..", "node_modules", "yarn", "bin");
  }

  return yPath;
}

module.exports = {
  runYarn,
  resolveYarn
};
