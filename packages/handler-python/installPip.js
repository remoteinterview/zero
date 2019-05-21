const pipUrl = "https://bootstrap.pypa.io/get-pip.py";
const https = require("https");
const fs = require("fs");
const path = require("path");
const which = require("which");
var spawn = require("child_process").spawn;
const getPythonExe = require("./pythonExe");

// downloads get-pip.py if not present already
module.exports = async () => {
  const pythonExe = getPythonExe();
  var pip = await getPipExe();
  if (pip) return pip;

  // install pip first
  var getPip = await getPipInstaller();
  return new Promise((resolve, reject) => {
    var child = spawn(pythonExe, [getPip, "install", "--user"]);
    child.on("close", async () => {
      var pip = await getPipExe();

      if (pip) {
        console.log("Pip installation completed.");
        resolve(pip);
      } else {
        console.log("Pip installation failed. Please install manually.");
      }
    });
  });
};

function getPipExe() {
  const pip =
    which.sync("pip", { nothrow: true }) ||
    which.sync("pip3", { nothrow: true });
  if (pip) {
    return pip;
  }

  // try python -m pip
  const pythonExe = getPythonExe();
  return new Promise((resolve, reject) => {
    var child = spawn(pythonExe, ["-m", "pip"]);
    child.on("close", code => {
      if (code === 0) resolve([pythonExe, "-m", "pip"]);
      else resolve();
    });
  });
}
function getPipInstaller() {
  // install pip
  return new Promise((resolve, reject) => {
    const pipFilePath = path.join(__dirname, "get-pip.py");
    if (fs.existsSync(pipFilePath)) return resolve(pipFilePath);

    const file = fs.createWriteStream(pipFilePath);
    const request = https.get(pipUrl, function(response) {
      response.pipe(file);
      file.on("finish", function() {
        file.close(() => {
          resolve(pipFilePath);
        });
      });
      file.on("error", function(err) {
        fs.unlink(pipFilePath);
        reject(err);
      });
    });
  });
}
