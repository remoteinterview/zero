const getPackages = require("zero-dep-tree-js").getPackages;
const fs = require("fs");
const os = require("os");
var glob = require("fast-glob");
const deepmerge = require("deepmerge");
var { fork } = require("child_process");
const commonDeps = require("zero-common-deps");
var path = require("path");
const debug = require("debug")("core");
var yarnPath = require.resolve("yarn/bin/yarn.js");
const fileToLambda = require("../utils/fileToLambda");
const builders = require("zero-builders-map");
process.env.YARN_PATH = yarnPath; // this is used by parcel bundler to install packages in runtime using yarn only

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
  var builderType = fileToLambda(file);
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
  var builderType = fileToLambda(file);
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
function runYarn(cwd, args, resolveOutput) {
  const isWin = os.platform() === "win32";

  return new Promise((resolve, reject) => {
    debug("yarn", yarnPath, args, cwd);
    var child = fork(yarnPath, args || [], {
      cwd: cwd,
      stdio: !resolveOutput ? "inherit" : "pipe"
    });
    if (isWin) {
      // a windows bug. need to press enter sometimes
      try {
        // process.stdin.write("\n");
        // process.stdin.end();
      } catch (e) {}
    }

    var output = "";
    if (resolveOutput) {
      child.stdout.on("data", data => {
        output += data;
      });
    }

    child.on("exit", code => {
      debug("yarn completed");
      resolve(output);
    });
  });
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
    var builderDeps = {};
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

      // add builder specific deps
      var depsByThisBuilder = getBuilderDeps(file);
      if (depsByThisBuilder) {
        builderDeps = { ...builderDeps, ...depsByThisBuilder };
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

        Object.keys(builderDeps).forEach(dep => {
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
      await writePackageJSON(buildPath, deps, builderDeps);
      debug("installing", deps, builderDeps);

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

async function writePackageJSON(buildPath, deps, builderDeps) {
  // first load current package.json if present
  var pkgjsonPath = path.join(buildPath, "/package.json");
  var newDepsFound = false;
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

  // the base packages required by zero
  var depsJson = commonDeps.dependenciesToBeInstalled();

  if (pkg.dependencies) {
    Object.keys(depsJson).forEach(key => {
      pkg.dependencies[key] = depsJson[key];
    });
  } else {
    pkg.dependencies = depsJson;
  }

  // the combined object of packages needed by all builders being used.
  if (builderDeps) {
    Object.keys(builderDeps).forEach(key => {
      pkg.dependencies[key] = builderDeps[key];
    });
  }

  // append user's imported packages (only if not already defined in package.json)
  for (var i in deps) {
    const dep = deps[i];
    if (!pkg.dependencies[dep]) {
      newDepsFound = true;
      pkg.dependencies[dep] = await getNPMVersion(dep);
    }
  }

  // also save any newfound deps into user's pkg.json
  // in sourcepath. But minus our hardcoded depsJson

  // if (newDepsFound) {
  //   var userPkg = JSON.parse(JSON.stringify(pkg)); // make a copy
  //   Object.keys(depsJson).forEach(key => {
  //     delete userPkg.dependencies[key];
  //   });
  //   console.log(`\x1b[2mUpdating package.json\x1b[0m\n`);
  //   fs.writeFileSync(
  //     path.join(process.env.SOURCEPATH, "/package.json"),
  //     JSON.stringify(userPkg, null, 2),
  //     "utf8"
  //   );
  // }

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
  var gitignorePath = path.join(process.env.SOURCEPATH, "/.gitignore");
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(
      gitignorePath,
      ".DS_Store\n.zero\nzero-builds\nnode_modules",
      "utf8"
    );
  }
}

module.exports = installPackages;
