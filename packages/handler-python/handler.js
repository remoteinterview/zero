const pythonExe = require("./pythonExe")();
var spawn = require("child_process").spawn;
const path = require("path");
const expressWrap = require("./expressWrap");

module.exports = async (
  basePath,
  entryFile,
  lambdaType,
  serverAddress,
  BundlePath,
  BundleInfo,
  isModule
) => {
  return new Promise((resolve, reject) => {
    var child = spawn(
      pythonExe,
      [path.join(__dirname, "entryfile.py"), basePath, entryFile],
      {
        stdio: [0, 1, 2, "ipc", "pipe"]
      }
    );

    // we open a 4th stdio as IPC doesn't work on windows for python->node
    child.stdio[4].on("data", function(message) {
      // TODO: only send port after flask is running so we can remove this timeout hack
      setTimeout(() => {
        if (isModule) resolve(expressWrap(message.toString().trim()));
        else {
          process.send(message.toString());
          resolve(message.toString());
        }
      }, 100);
    });
  });
};
