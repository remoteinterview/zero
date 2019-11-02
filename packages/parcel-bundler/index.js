process.env.ZERO_COMMON_DEPS_PATH = require.resolve("zero-common-deps");

var Bundler = require("parcel-bundler");
var localRequire = require("parcel-bundler/src/utils/localRequire");
const logger = require("@parcel/logger");
const pkg = require("./package");

/// modify parcel to load plugins from zero's folder instead of user's package.json
Bundler.prototype.loadPlugins = async function() {
  let relative = __dirname;
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
