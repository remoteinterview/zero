const path = require("path");
const { resolveYarn } = require("./yarn");
const slash = require("./fixPathSlashes");
const debug = require("debug")("core");
const fs = require("fs");

module.exports = function setupEnvVariables(sourcePath, cwd) {
  // Load environment variables from .env file if present
  if (!cwd) cwd = sourcePath;
  debug("sourcePath", sourcePath);

  // check if cwd is not sourcePath AND sourcePath is <cwd>/<sourcePath>
  // in that special case:
  // all config files (.babelrc, package.json, .env) might be in cwd instead of
  // sourcePath (<cwd>/www)
  var projectPath = slash(path.resolve(sourcePath));
  var relativeTest = path.relative(cwd, sourcePath);
  if (relativeTest && !relativeTest.startsWith(".")) {
    if (fs.existsSync(path.join(cwd, "package.json"))) {
      projectPath = cwd;
      debug("projectPath", projectPath);
    }
  }
  process.env.PROJECTPATH = slash(projectPath);

  require("dotenv").config({ path: path.resolve(projectPath, ".env") });
  // Default env variables.
  process.env.PATH += ":" + resolveYarn();
  // we resolve the absolute path of source directory to avoid confusion in bundlers and handlers
  process.env.SOURCEPATH = slash(path.resolve(sourcePath));
  const DEFAULTBUILDPATH = path.join(process.env.SOURCEPATH, ".zero");
  process.env.PORT = process.env.PORT || 3000;
  process.env.SESSION_TTL =
    process.env.SESSION_TTL || 1000 * 60 * 60 * 24 * 365; // 1 year
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || "k3yb0Ard c@t";
  process.env.BUILDPATH = slash(process.env.BUILDPATH || DEFAULTBUILDPATH);
};
