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

var toBeInstalledLocally = notToBeLinked.concat([
  "react",
  "react-dom",
  "react-helmet-async",
  "react-hot-loader",
  // "babel-preset-zeroserver",
  "@hot-loader/react-dom",
  "vue",
  "vue-template-compiler",
  "vue-hot-reload-api",
  "vue-meta",
  "@mdx-js/react",
  "@mdx-js/tag"
]);
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
