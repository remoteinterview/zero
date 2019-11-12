/*
Run the builder step (if any) for given page
- builder is run in a separate process
- builder may run a watcher for HMR in dev mode
- builder will send back an object which will be
  passed to that page type's handler as function 
  argument.
*/

const debug = require("debug")("core");
const fork = require("child_process").fork;
const bundlerProgram = require.resolve("zero-builder-process");

function getBuildInfo(endpointData, onClose) {
  return new Promise(async (resolve, reject) => {
    const lambdaID = endpointData.id;

    if (!bundlerProgram) return resolve({ info: false });
    const parameters = [
      endpointData.path,
      endpointData.entryFile,
      endpointData.type,
      ".zero/zero-builds/" + lambdaID
    ];
    const options = {
      stdio: [0, 1, 2, "ipc"]
    };

    const child = fork(bundlerProgram, parameters, options);
    child.on("message", message => {
      return resolve({ child, info: message });
    });

    child.on("close", () => {
      debug("bundler process closed", lambdaID);
      if (onClose) onClose();
    });
  });
}

module.exports = getBuildInfo;
