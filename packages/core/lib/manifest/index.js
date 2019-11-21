/*
Manifest is the list of all visit-able pages (not static files)
and all frequently needed data (relevant files, build info, page type).

This class builds a new manifest on start and on all file changes.
Before building the manifest, it also invokes package installer to
install any newly imported npm packages.

If a python file is found, we also run python's pip installer once.
*/

const EventEmitter = require("events");
const debug = require("debug")("core");
const buildManifest = require("./buildManifest");
const installPackages = require("./installPackages");
const ora = require("ora");
const spinner = ora({
  color: "green",
  spinner: "star",
  text: "Starting..."
});

class Manifest extends EventEmitter {
  constructor(sourcePath, fileWatch) {
    super();
    sourcePath = sourcePath.endsWith("/") ? sourcePath : sourcePath + "/";
    this.sourcePath = sourcePath;
    this.manifest = false;
    this.lastChangeData = false;

    // build the manifest the first time
    fileWatch.on("ready", this.updateManifest.bind(this));

    // rebuild on file change events.
    fileWatch.on("change", async files => {
      var currentManifest = this.manifest;
      var filesUpdated = [];
      files.forEach(f => {
        // check if we have pages that depend on this file
        if (currentManifest && currentManifest.fileToPages[f]) {
          filesUpdated = filesUpdated.concat(currentManifest.fileToPages[f]);
        } else {
          // otherwise just add the file itself.
          filesUpdated.push(f);
        }
      });

      debug("filesUpdated", filesUpdated);
      await this.updateManifest(filesUpdated);
    });
  }

  async updateManifest(filesUpdated) {
    var dependencies = await installPackages(this.sourcePath, filesUpdated);
    spinner.start("Generating manifest");
    const manifest = await buildManifest(
      this.sourcePath,
      this.manifest,
      filesUpdated
    );

    var forbiddenFiles = [];
    manifest.pages.forEach(page => {
      forbiddenFiles.push(page.entryFile);
      // TODO: see if dependancy tree files are also to be added here or not.
    });
    debug("manifest", manifest);

    // show server address on first build
    if (!process.env.ISBUILDER && !this.manifest) {
      var serverAddress =
        process.env.SERVERADDRESS || "http://localhost:" + process.env.PORT;
      spinner.succeed("Server running on " + serverAddress);
    } else {
      spinner.stop();
    }

    this.manifest = manifest;

    // emit change event which will be handled by router or builder
    this.lastChangeData = {
      manifest,
      forbiddenFiles,
      filesUpdated,
      dependencies
    };
    this.emit("change", this.lastChangeData);
  }

  on(event, callback) {
    // send new listener the initial data before subscribing them
    if (this.lastChangeData && event === "change") {
      callback(this.lastChangeData);
    }
    super.on(event, callback);
  }
}

module.exports = Manifest;
