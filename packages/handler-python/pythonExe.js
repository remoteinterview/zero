const which = require("which");
var spawn = require("child_process").spawn;
const path = require("path");
const pythonExists = which.sync("python", { nothrow: true });
const python3Exists = which.sync("python3", { nothrow: true });
const pythonWinExists = which.sync("py", { nothrow: true });

module.exports = () => {
  const pythonExe = python3Exists || pythonExists || pythonWinExists;
  if (!pythonExe)
    throw new Error(
      "No 'python' found in the PATH. Zero needs Python3 to serve '.py' files.\nHow to install: https://www.python.org/downloads/."
    );
  //console.log("spawning child", pythonExe, [path.join(__dirname, "entryfile.py"), basePath, entryFile])
  return pythonExe;
};
