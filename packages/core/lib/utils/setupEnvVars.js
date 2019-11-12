const path = require("path");
const { resolveYarn } = require("./yarn");
const slash = require("./fixPathSlashes");
const debug = require("debug")("core");

module.exports = function setupEnvVariables(sourcePath) {
  // Load environment variables from .env file if present
  debug("sourcePath", sourcePath);
  require("dotenv").config({ path: path.resolve(sourcePath, ".env") });
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
