const Manifest = require("./manifest");
const startRouter = require("./router");
const path = require("path");
const fs = require("fs");
const del = require("del");
const mkdirp = require("mkdirp");
const Watcher = require("./utils/watcher");
const slash = require("./utils/fixPathSlashes");
const pkg = require("../package");
const setupEnvVariables = require("./utils/setupEnvVars");
const ISDEV = process.env.NODE_ENV !== "production";

module.exports = async function server(sourcePath) {
  setupEnvVariables(sourcePath);

  // create the build folder if not present already
  mkdirp.sync(process.env.BUILDPATH);

  console.log(`\x1b[2m⚡️ Zero ${pkg.version ? `v${pkg.version}` : ""}\x1b[0m`);

  var fileWatch = new Watcher(sourcePath, ISDEV);
  var manifest = new Manifest(sourcePath, fileWatch);

  startRouter(sourcePath, manifest);

  // clear any `zero build` configs to avoid confusion
  var buildConfigPath = path.join(
    process.env.BUILDPATH,
    "zero-builds",
    "_config"
  );
  if (fs.existsSync(buildConfigPath)) {
    await del([slash(path.join(buildConfigPath, "/**"))], {
      force: true
    });
  }

  // clean any `node_modules` INSIDE .zero folder if it exists.
  var dupNodeModules = path.join(process.env.BUILDPATH, "node_modules");
  if (fs.existsSync(dupNodeModules)) {
    await del([slash(path.join(dupNodeModules, "/**"))], {
      force: true
    });
  }

  return new Promise((resolve, reject) => {
    var hasResolved = false;
    manifest.on("change", () => {
      hasResolved = true;
      resolve();
    });
  });
};
