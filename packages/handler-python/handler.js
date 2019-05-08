const pythonExe = require("./pythonExe")();
var spawn = require("child_process").spawn;
const path = require("path");

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
        stdio: [0, 1, 2, "ipc"]
      }
    );
    child.on("message", function(message) {
      // TODO: only send port after flask is running so we can remove this timeout hack
      setTimeout(() => {
        if (!isModule) process.send(message);
        resolve(message); //TODO: return an express app not port
      }, 100);
    });
  });
};
