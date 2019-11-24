require("./applyMods")(); // apply our mods
// this is a wrapper around parcel, need to apply patches to parcel
var Bundler = require("parcel-bundler");
var localRequire = require("parcel-bundler/src/utils/localRequire");
const logger = require("@parcel/logger");
const pkg = require("./package");
const path = require("path");

// limit workers parcel can spawn to 0 by default
// we do this because we spawn a parcel process for each page
// and we don't want each of them to spawn their own 2 or so worker processes.
process.env.PARCEL_WORKERS = process.env.PARCEL_WORKERS || 0;

/// modify parcel to load plugins from zero's folder instead of user's package.json
Bundler.prototype.loadPlugins = async function() {
  let relative = path.dirname(
    path.join(require.resolve("parcel-bundler"), "..")
  );
  if (!pkg) {
    return;
  }

  try {
    let deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
    for (let dep in deps) {
      const pattern = /^(@.*\/)?parcel-plugin-.+/;
      if (pattern.test(dep)) {
        let plugin = await localRequire(dep, relative);
        await plugin(this);
      }
    }
  } catch (err) {
    logger.warn(err);
  }
};

module.exports = Bundler;
