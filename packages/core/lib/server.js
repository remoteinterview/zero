const build = require("./builder");
const startRouter = require("./router");
const path = require("path");
const fs = require("fs");
const del = require("del");
const mkdirp = require("mkdirp");
const slash = require("./utils/fixPathSlashes");
const pkg = require("../package");
const setupEnvVariables = require("./utils/setupEnvVars");

module.exports = async function server(sourcePath) {
  setupEnvVariables(sourcePath);

  // create the build folder if not present already
  mkdirp.sync(process.env.BUILDPATH);

  console.log(`\x1b[2m⚡️ Zero ${pkg.version ? `v${pkg.version}` : ""}\x1b[0m`);
  var updateManifestFn = startRouter(
    /*manifest, forbiddenFiles,*/ process.env.SOURCEPATH
  );

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
  return new Promise((resolve, reject) => {
    build(
      sourcePath,
      process.env.BUILDPATH,
      (manifest, forbiddenFiles, filesUpdated) => {
        updateManifestFn(manifest, forbiddenFiles, filesUpdated);
        resolve();
      }
    );
  });
};
