const bundle = require("./bundle");
const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");

async function bundler(componentPath, bundlePath, basePath) {
  var fullBundlePath = path.join(process.env.BUILDPATH, bundlePath);

  // generate bundle for node
  await bundleNode(componentPath, fullBundlePath, basePath, bundlePath, true);

  // also for browser
  await bundle(componentPath, fullBundlePath, basePath, bundlePath);

  return {
    jsNode: fs.existsSync(path.join(fullBundlePath, "/bundle.node.js"))
      ? path.join(bundlePath, "/bundle.node.js")
      : false,
    js: fs.existsSync(path.join(fullBundlePath, "/bundle.js"))
      ? path.join(bundlePath, "/bundle.js")
      : false,
    css: fs.existsSync(path.join(fullBundlePath, "/bundle.css"))
      ? path.join(bundlePath, "/bundle.css")
      : false
  };
}

// node bundler runs in a separate process because
// two parcel instances can't run in a single process.
// https://github.com/parcel-bundler/parcel/issues/1903

var childProcess;
function cleanProcess() {
  if (childProcess) childProcess.kill();
}
process.on("exit", cleanProcess);
process.on("SIGTERM", cleanProcess);

function bundleNode(componentPath, fullBundlePath, basePath, bundlePath) {
  return new Promise((resolve, reject) => {
    const parameters = [componentPath, fullBundlePath, basePath, bundlePath];

    const options = {
      stdio: [0, 1, 2, "ipc"]
    };

    childProcess = fork(require.resolve("./bundleNode"), parameters, options);
    // process doesn't exit in watch mode.
    childProcess.on("message", data => {
      resolve();
    });
  });
}

module.exports = bundler;
