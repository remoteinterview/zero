process.env.ZERO_COMMON_DEPS_PATH = require.resolve("zero-common-deps");

// copy modified parcel files into their places.
const fs = require("fs"),
  path = require("path");
const mods = [
  ["parcel-bundler/src/utils/Resolver", "Resolver.js"],
  // modify localRequire to check commonDeps path too.
  ["parcel-bundler/src/utils/localRequire", "localRequire.js"],
  // modify babelrc to not install babel@core and infer version 7 already present.
  ["parcel-bundler/src/transforms/babel/babelrc", "babelrc.js"]
];

mods.forEach(mod => {
  fs.writeFileSync(
    require.resolve(mod[0]),
    fs.readFileSync(path.join(__dirname, "mods", mod[1]), "utf8"),
    "utf8"
  );
});

////

var Bundler = require("parcel-bundler");
var localRequire = require("parcel-bundler/src/utils/localRequire");
const logger = require("@parcel/logger");
const config = require("parcel-bundler/src/utils/config");
const Path = require("path");
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
