// holds all the deps that are common between the library and the user app

const pkg = require("./package");
//const path = require("path");

var toBeInstalledLocally = [
  "@babel/core",
  "@babel/runtime",
  "regenerator-runtime",
  "@babel/plugin-proposal-class-properties",
  "babel-plugin-transform-zero-dirname-filename",
  "@babel/plugin-transform-runtime",
  "sass"
];
module.exports = {
  resolvePath: pkgName => require.resolve(pkgName),
  dependencies: () => {
    return pkg.dependencies;
  },
  dependenciesToBeInstalled: () => {
    var deps = pkg.dependencies;
    var toBeInstalled = {};
    toBeInstalledLocally.forEach(pkgName => {
      toBeInstalled[pkgName] = deps[pkgName];
    });

    return toBeInstalled;
  }
};
