const path = require("path");
const debug = require("debug")("core");
const fs = require("fs");
const buildManifest = require("./buildManifest");
const installPackages = require("./installPackages");
const Watcher = require("../watcher");
const ora = require("ora");
const ISDEV = process.env.NODE_ENV !== "production";
const slash = require("../utils/fixPathSlashes");
const spinner = ora({
  color: "green",
  spinner: "star",
  text: "Starting..."
});

module.exports = async function build(
  sourcePath,
  buildPath,
  onManifest,
  isBuilder
) {
  var currentManifest = false;

  debug("buildPath", buildPath);
  var fileWatch = new Watcher(sourcePath, isBuilder || !ISDEV ? false : true);
  fileWatch.on("ready", async () => {
    const { manifest, forbiddenFiles, dependencies } = await updateManifest(
      sourcePath,
      currentManifest
    );
    currentManifest = manifest;
    var serverAddress =
      process.env.SERVERADDRESS || "http://localhost:" + process.env.PORT;

    if (!isBuilder) {
      spinner.succeed("Server running on " + serverAddress);
    } else {
      spinner.stop();
    }

    onManifest(manifest, forbiddenFiles, false, dependencies);
  });

  fileWatch.on("change", async files => {
    var filesUpdated = [];
    files.forEach(f => {
      // check if we have pages that depend on this file
      if (currentManifest && currentManifest.fileToLambdas[f]) {
        filesUpdated = filesUpdated.concat(currentManifest.fileToLambdas[f]);
      } else {
        // otherwise just add the file itself.
        filesUpdated.push(f);
      }
    });

    debug("filesUpdated", filesUpdated);
    const { manifest, forbiddenFiles, dependencies } = await updateManifest(
      sourcePath,
      currentManifest,
      filesUpdated
    );
    currentManifest = manifest;

    spinner.stop();
    onManifest(manifest, forbiddenFiles, filesUpdated, dependencies);
  });
};

async function updateManifest(buildPath, currentManifest, updatedFiles) {
  //spinner.start("Updating packages");
  var deps = await installPackages(buildPath, updatedFiles);
  spinner.start("Generating manifest");
  const manifest = await buildManifest(
    buildPath,
    currentManifest,
    updatedFiles
  );

  var forbiddenFiles = [];
  manifest.lambdas.forEach(endpoint => {
    forbiddenFiles.push(endpoint.entryFile);
    // TODO: see if dependancy tree files are also to be added here or not.
  });
  debug("manifest", manifest);
  return { manifest, forbiddenFiles, dependencies: deps };
}
