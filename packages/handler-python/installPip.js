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
  var pip = getPipExe();
  if (pip) return pip;

  // install pip first
  var getPip = await getPipInstaller();
  return new Promise((resolve, reject) => {
    var child = spawn(pythonExe, [getPip, "install", "--user"]);
    child.on("close", () => {
      console.log("Pip installation completed.");
      resolve(getPipExe);
    });
  });
};

function getPipExe() {
  return (
    which.sync("pip", { nothrow: true }) ||
    which.sync("pip3", { nothrow: true })
  );
}
async function getPipInstaller() {
  // install pip
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
}
