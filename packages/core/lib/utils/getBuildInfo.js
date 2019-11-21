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

function getBuildInfo(pageData, onClose) {
  return new Promise(async (resolve, reject) => {
    const pageId = pageData.id;

    if (!bundlerProgram) return resolve({ info: false });
    const parameters = [
      pageData.path,
      pageData.entryFile,
      pageData.type,
      ".zero/zero-builds/" + pageId
    ];
    const options = {
      stdio: [0, 1, 2, "ipc"]
    };

    const child = fork(bundlerProgram, parameters, options);
    child.on("message", message => {
      return resolve({ child, info: message });
    });

    child.on("close", () => {
      debug("bundler process closed", pageId);
      if (onClose) onClose();
    });
  });
}

module.exports = getBuildInfo;
