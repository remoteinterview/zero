const installPip = require("./installPip");
var spawn = require("child_process").spawn;
const fs = require("fs");
const path = require("path");
// const pythonExe = require("./pythonExe")()

// zero calls this function on boot only if python files are present in the project.
module.exports = async (buildPath, pipPath) => {
  // make pip available (if not present)
  if (!pipPath) pipPath = await installPip();

  // fix requirements.txt
  var reqFile = ["flask==0.12.2"].join("\n");
  var reqFilePath = path.join(buildPath, "requirements.txt");
  if (fs.existsSync(reqFilePath)) {
    reqFile += "\n" + fs.readFileSync(reqFilePath, "utf8");
  }
  // remove duplicates(and empty lines) if any
  reqFile = reqFile
    .split("\n")
    .filter(function(elem, index, self) {
      return index == self.indexOf(elem) && elem.trim() !== "";
    })
    .join("\n");
  // console.log("reqFile", reqFile, pipPath)
  return new Promise((resolve, reject) => {
    var child = spawn(pipPath, ["install", "-r", reqFilePath], {
      stdio: [0, 1, 2]
    });
    child.on("close", () => {
      // console.log("Requirements install completed.")
      resolve();
    });
  });
};
