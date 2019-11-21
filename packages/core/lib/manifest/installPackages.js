const getPackages = require("zero-dep-tree-js").getPackages;
const fs = require("fs");
const { runYarn } = require("../utils/yarn");
var glob = require("fast-glob");
const getCommonDeps = require("../utils/commonDependencies");
var path = require("path");
const debug = require("debug")("core");

const fileToPageType = require("../utils/fileToPageType");
const builders = require("zero-builders-map");

var firstRun = true;
//process.on('unhandledRejection', up => { throw up });

const baseBabelConfig = {
  plugins: [
    "babel-plugin-transform-zero-dirname-filename",

    "@babel/plugin-transform-runtime",
    [
      "@babel/plugin-proposal-class-properties",
      {
        loose: true
      }
    ]
  ]
};

// see if the builder wants to update the babel config
function updateBabelConfig(currentBabelConfig, file) {
  var builderType = fileToPageType(file);
  if (
    builderType &&
    builders[builderType] &&
    builders[builderType].updateBabelConfig
  ) {
    return builders[builderType].updateBabelConfig(currentBabelConfig);
  }

  // no change
  return currentBabelConfig;
}

function getBuilderDeps(file) {
  var builderType = fileToPageType(file);
  if (
    builderType &&
    builders[builderType] &&
    builders[builderType].dependencies
  ) {
    // check if it's a function
    if (typeof builders[builderType].dependencies === "function") {
      return builders[builderType].dependencies(file);
    }

    // just an object
    return builders[builderType].dependencies;
  }
  return false;
}

async function getNPMVersion(pkgName) {
  try {
    var json = await runYarn(
      process.env.BUILDPATH,
      ["info", pkgName, "version", "--json"],
      true
    );
    return JSON.parse(json).data;
  } catch (e) {
    debug(
      `[yarn ${pkgName} version]`,
      "couldn't fetch package info. Returning `latest`",
      e
    );
    return "latest";
  }
}

async function getFiles(baseSrc) {
  return glob(path.join(baseSrc, "/**"), {
    onlyFiles: true,
    ignore: ["node_modules/**", ".zero/**"]
  });
}

function installPackages(buildPath, filterFiles, pkgPath) {
  if (!pkgPath) pkgPath = buildPath;
  return new Promise(async (resolve, reject) => {
    var files = await getFiles(buildPath);
    files = files.filter(f => {
      f = path.relative(buildPath, f);
      return (
        f.indexOf("node_modules") === -1 && f.indexOf("zero-builds") === -1
      );
    });
    debug("files", files);
    var deps = [];
    var commonDepsNeeded = {};
    var babelConfig = baseBabelConfig;
    var babelSrcPath = path.join(process.env.SOURCEPATH, "/.babelrc");
    if (fs.existsSync(babelSrcPath)) {
      try {
        babelConfig = JSON.parse(fs.readFileSync(babelSrcPath, "utf8"));
      } catch (e) {}
    }

    var pkgJsonChanged = false;
    // build a list of packages required by all js files
    files.forEach(file => {
      if (
        filterFiles &&
        filterFiles.length > 0 &&
        filterFiles.indexOf(file) === -1
      ) {
        debug("konan skip", file);
        return;
      }

      // if pkg.json is changed
      if (path.relative(buildPath, file).toLowerCase() === "package.json") {
        pkgJsonChanged = true;
      }

      // extract imports
      deps = deps.concat(getPackages(file));

      // add common deps needed for this file type
      var depsCommonForThisFile = getCommonDeps(file);
      if (depsCommonForThisFile) {
        commonDepsNeeded = { ...commonDepsNeeded, ...depsCommonForThisFile };
      }
      // add builder specific deps
      var depsByThisBuilder = getBuilderDeps(file);
      if (depsByThisBuilder) {
        commonDepsNeeded = { ...commonDepsNeeded, ...depsByThisBuilder };
      }

      // modify babelrc if builders wants to
      babelConfig = updateBabelConfig(babelConfig, file);
    });

    deps = deps.filter(function(item, pos) {
      return deps.indexOf(item) == pos;
    });

    // check if these deps are already installed
    var pkgjsonPath = path.join(pkgPath, "/package.json");
    var allInstalled = false;
    if (fs.existsSync(pkgjsonPath)) {
      try {
        var pkg = require(pkgjsonPath);
        allInstalled = true; // we assume all is installed
        deps.forEach(dep => {
          if (!pkg || !pkg.dependencies || !pkg.dependencies[dep]) {
            allInstalled = false; //didn't find this dep in there.
          }
        });

        Object.keys(commonDepsNeeded).forEach(dep => {
          if (!pkg || !pkg.dependencies || !pkg.dependencies[dep]) {
            allInstalled = false; //didn't find this dep in there.
          }
        });
      } catch (e) {}
    }
    if (!allInstalled || firstRun || pkgJsonChanged) {
      console.log("⬇️  Updating packages");
      debug("yarn install hit", !!allInstalled, !!firstRun, !!pkgJsonChanged);
      // we must run npm i on first boot,
      // so we are sure pkg.json === node_modules
      firstRun = false;

      // add our .babelrc file
      fs.writeFileSync(
        babelSrcPath,
        JSON.stringify(babelConfig, null, 2),
        "utf8"
      );

      // now that we have a list. npm install them in our build folder
      await writePackageJSON(buildPath, deps, commonDepsNeeded);
      debug("installing", deps, commonDepsNeeded);

      runYarn(pkgPath, ["install"]).then(() => {
        // installed
        debug("Pkgs installed successfully.");
        resolve(deps);
      });
    } else {
      resolve(deps);
    }
  });
}

async function writePackageJSON(buildPath, deps, commonDepsNeeded) {
  // first load current package.json if present
  var pkgjsonPath = path.join(buildPath, "/package.json");
  var pkg = {
    name: "zero-app",
    private: true,
    scripts: {
      start: "zero"
    },
    dependencies: {}
  };
  if (fs.existsSync(pkgjsonPath)) {
    try {
      pkg = require(pkgjsonPath);
    } catch (e) {}
  }

  // the combined object of packages needed by zero and all builders being used.
  if (pkg.dependencies) {
    Object.keys(commonDepsNeeded).forEach(key => {
      pkg.dependencies[key] = commonDepsNeeded[key];
    });
  } else {
    pkg.dependencies = commonDepsNeeded;
  }

  // append user's imported packages (only if not already defined in package.json)
  for (var i in deps) {
    const dep = deps[i];
    if (!pkg.dependencies[dep]) {
      newDepsFound = true;
      pkg.dependencies[dep] = await getNPMVersion(dep);
    }
  }

  // need this alias for hot reload features of React 16+ to work.
  if (Object.keys(pkg.dependencies).indexOf("@hot-loader/react-dom") !== -1) {
    pkg.alias = pkg.alias || {};
    pkg.alias["react-dom"] = "@hot-loader/react-dom";
  }

  // write a pkg.json into tmp buildpath
  fs.writeFileSync(
    path.join(buildPath, "package.json"),
    JSON.stringify(pkg, null, 2),
    "utf8"
  );

  // add a .gitignore if not added by user
  var gitignorePath = path.join(buildPath, "/.gitignore");
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(
      gitignorePath,
      ".DS_Store\n.zero\nzero-builds\nnode_modules",
      "utf8"
    );
  }
}

module.exports = installPackages;
