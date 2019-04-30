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
  var reqFile = ["flask==0.12.2", "waitress==1.3.0"].join("\n");
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
  // write new req.txt
  fs.writeFileSync(reqFilePath, reqFile, "utf8");

  // install using pip
  return new Promise((resolve, reject) => {
    var child = spawn(pipPath, ["install", "-r", reqFilePath]);
    child.stdout.on("data", msg => {
      msg = msg
        .toString()
        .split("\n")
        .filter(m => {
          return m.indexOf("already satisfied") === -1;
        })
        .join("\n");
      process.stdout.write(msg);
    });
    child.stderr.on("data", m => process.stderr.write(m));
    child.on("close", () => {
      // console.log("Requirements install completed.")
      resolve();
    });
  });
};
