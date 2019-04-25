// holds all the deps that are common between the library and the user app

const pkg = require("./package");
const path = require("path");

var notToBeLinked = [
  "@babel/core",
  "@babel/plugin-transform-runtime",
  "@babel/runtime",
  "regenerator-runtime",
  "@babel/plugin-transform-runtime",
  "@babel/plugin-proposal-class-properties",
  "babel-plugin-react-require"
];
module.exports = {
  resolvePath: pkgName => {},
  dependencies: () => {
    return pkg.dependencies;
  },
  dependenciesWithLocalPaths: () => {
    var deps = pkg.dependencies;
    var newDeps = {};
    //var node_modulesPath = path.join(require.resolve('react'), "..")
    Object.keys(deps).forEach(pkgName => {
      //var localPath = path.join(node_modulesPath, pkgName)
      try {
        // try to resolve using require (and get the package folder path not index.js)
        if (notToBeLinked.indexOf(pkgName) === -1) {
          var localPath = path.dirname(
            require.resolve(`${pkgName}/package.json`)
          );
          newDeps[pkgName] = `link:${localPath}`;
        } else {
          // some packages don't like to be linked
          newDeps[pkgName] = deps[pkgName];
        }
      } catch (e) {
        // fallback to npm version if local fails
        newDeps[pkgName] = deps[pkgName];
      }
    });
    return newDeps;
  }
};
