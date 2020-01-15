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
  var reqCombinedFilePath = path.join(
    process.env.BUILDPATH,
    "requirements.txt"
  );
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
  fs.writeFileSync(reqCombinedFilePath, reqFile, "utf8");

  // install using pip
  return new Promise((resolve, reject) => {
    const processName = typeof pipPath === "string" ? pipPath : pipPath[0];
    const packageFolder = path.join(process.env.BUILDPATH, "python_modules");
    const defaultArgs = [
      "install",
      "--exists-action",
      "i",
      "-r",
      reqCombinedFilePath
    ];
    const args =
      typeof pipPath === "string"
        ? defaultArgs
        : pipPath.slice(1).concat(defaultArgs);
    var child = spawn(processName, args, {
      env: { ...process.env, PIP_TARGET: packageFolder }
    });
    child.stderr.on("data", msg => {
      process.stdout.write(filterStdout(msg.toString()));
    });
    child.stdout.on("data", msg => {
      process.stdout.write(filterStdout(msg.toString()));
    });
    child.on("close", () => {
      resolve();
    });
  });
};

function filterStdout(msg) {
  return msg
    .split("\n")
    .filter(m => {
      return (
        m.indexOf("already satisfied") === -1 &&
        m.indexOf("Collecting ") === -1 &&
        m.indexOf("already exists") === -1 &&
        m.indexOf("Using cached ") === -1
      );
    })
    .join("\n");
}
