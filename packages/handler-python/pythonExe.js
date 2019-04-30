const which = require("which");
var spawn = require("child_process").spawn;
const path = require("path");
const pythonExists = which.sync("python", { nothrow: true });
const python3Exists = which.sync("python3", { nothrow: true });

module.exports = () => {
  const pythonExe = python3Exists || pythonExists;
  if (!pythonExe)
    throw new Error(
      "No 'python' found in the PATH. You need to install Python."
    );
  //console.log("spawning child", pythonExe, [path.join(__dirname, "entryfile.py"), basePath, entryFile])
  return pythonExe;
};
