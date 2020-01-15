const pythonExe = require("./pythonExe")();
var spawn = require("child_process").spawn;
const path = require("path");
const expressWrap = require("./expressWrap");
const waitPort = require("wait-port");

module.exports = async (pageData, buildInfo) => {
  return new Promise((resolve, reject) => {
    // change basePath $params format to flask's format: <param>
    var basePath = pageData.path
      .split("/")
      .map(p => {
        if (p.startsWith("$")) return "<" + p.slice(1) + ">";
        return p;
      })
      .join("/");
    const packageFolder = path.join(process.env.BUILDPATH, "python_modules");
    var child = spawn(
      pythonExe,
      [path.join(__dirname, "entryfile.py"), basePath, pageData.entryFile],
      {
        cwd: path.dirname(pageData.entryFile),
        // add our custom pip packages path to PATH so python can find them.
        env: {
          ...process.env,
          PATH:
            (process.env.PATH ? process.env.PATH + ":" : "") +
            path.join(packageFolder, "bin"),
          PYTHONPATH:
            (process.env.PYTHONPATH ? process.env.PYTHONPATH + ":" : "") +
            packageFolder
        },
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
