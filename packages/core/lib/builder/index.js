const path = require("path");
const debug = require("debug")("core");
const fs = require("fs");
const buildManifest = require("./buildManifest");
const installPackages = require("./installPackages");
const watch = require("./watcher");
const ora = require("ora");
const ISDEV = process.env.NODE_ENV !== "production";
const slash = require("../utils/fixPathSlashes");
const spinner = ora({
  color: "green",
  spinner: "star",
  text: "Starting..."
});

var watchDeferTimeoutID = false;
var pendingFilesChanged = [];
module.exports = async function build(
  sourcePath,
  buildPath,
  onManifest,
  isBuilder
) {
  var currentManifest = false;

  debug("buildPath", buildPath);

  watch(
    {
      sources: [path.join(sourcePath, "/**/*")],
      target: buildPath,
      buildPath,
      sourcePath,
      watch: isBuilder || !ISDEV ? false : true,
      clean: true,
      cleanModules: isBuilder
    },
    async (event, file) => {
      debug("CHANGE", event, file);

      if (file) pendingFilesChanged.push(file);
      // recreate manifest
      // wait until files have 'settled'.
      if (watchDeferTimeoutID) {
        clearTimeout(watchDeferTimeoutID);
      }
      watchDeferTimeoutID = setTimeout(async () => {
        var filesArr = pendingFilesChanged.slice(0);
        pendingFilesChanged = [];
        var filesUpdated = filesArr.length > 0 ? [] : false;
        filesArr &&
          filesArr.forEach(f => {
            // check if we have lambdas that depend on this file
            if (currentManifest && currentManifest.fileToLambdas[f]) {
              filesUpdated = filesUpdated.concat(
                currentManifest.fileToLambdas[f]
              );
            } else {
              // otherwise just add the file itself.
              filesUpdated.push(f);
            }
          });

        debug("filesUpdated", filesUpdated);
        const { manifest, forbiddenFiles, dependencies } = await updateManifest(
          sourcePath,
          currentManifest,
          filesUpdated,
          buildPath
        );
        currentManifest = manifest;
        var serverAddress =
          process.env.SERVERADDRESS || "http://localhost:" + process.env.PORT;

        // check if directory is empty on first run
        if (!isBuilder && event === "ready") {
          spinner.succeed("Server running on " + serverAddress);
        } else if (!isBuilder) {
          spinner.stop(); //("Server running on " + serverAddress);
        } else {
          spinner.stop();
        }

        onManifest(manifest, forbiddenFiles, filesUpdated, dependencies);
      }, 1000);
    }
  );
};

async function updateManifest(
  buildPath,
  currentManifest,
  updatedFiles,
  pkgPath
) {
  //spinner.start("Updating packages");
  var deps = await installPackages(buildPath, updatedFiles, pkgPath);
  spinner.start("Generating manifest");
  const manifest = await buildManifest(
    buildPath,
    currentManifest,
    updatedFiles
  );

  var forbiddenFiles = [];
  manifest.lambdas.forEach(endpoint => {
    forbiddenFiles.push(endpoint[1]);
    // TODO: see if dependancy tree files are also to be added here or not.
  });
  debug("manifest", manifest);
  return { manifest, forbiddenFiles, dependencies: deps };
}
