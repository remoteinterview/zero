const pythonExe = require("./pythonExe")();
var spawn = require("child_process").spawn;
const path = require("path");
const expressWrap = require("./expressWrap");
const waitPort = require("wait-port");

module.exports = async (endpointData, buildInfo) => {
  return new Promise((resolve, reject) => {
    // change basePath $params format to flask's format: <param>
    var basePath = endpointData.path
      .split("/")
      .map(p => {
        if (p.startsWith("$")) return "<" + p.slice(1) + ">";
        return p;
      })
      .join("/");
    var child = spawn(
      pythonExe,
      [path.join(__dirname, "entryfile.py"), basePath, endpointData.entryFile],
      {
        cwd: path.dirname(endpointData.entryFile),
        stdio: [0, 1, 2, "ipc", "pipe"]
      }
    );

    // we open a 4th stdio as IPC doesn't work on windows for python->node
    child.stdio[4].on("data", async function(message) {
      await waitPort({
        port: parseInt(message.toString()),
        output: "silent",
        timeout: 1000 * 60 * 2 // 2 Minutes
      });
      resolve(expressWrap(message.toString().trim()));
    });
  });
};
