const getPackages = require("zero-dep-tree-js").getPackages;
const fs = require("fs");
const os = require("os");
var glob = require("fast-glob");
const deepmerge = require("deepmerge");
var { fork } = require("child_process");
const commonDeps = require("zero-common-deps");
var path = require("path");
const debug = require("debug")("core");

var firstRun = true;
//process.on('unhandledRejection', up => { throw up });

const babelConfig = {
  plugins: [
    "babel-plugin-react-require",
    ["@babel/plugin-transform-runtime"],
    [
      "@babel/plugin-proposal-class-properties",
      {
        loose: true
      }
    ]
  ]
};

const htmlnanoConfig = {
  minifySvg: false
};

function runYarn(cwd, args, resolveOutput) {
  const isWin = os.platform() === "win32";
  var yarnPath = require.resolve("yarn/bin/yarn.js");

  return new Promise((resolve, reject) => {
    debug("yarn", yarnPath, args);

    var child = fork(yarnPath, args || [], {
      cwd: cwd,
      stdio: !resolveOutput ? "inherit" : "pipe"
    });
    if (isWin) {
      // a windows bug. need to press enter sometimes
      try {
        process.stdin.write("\n");
        process.stdin.end();
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
  return glob(path.join(baseSrc, "/**"), { onlyFiles: true });
}

function installPackages(buildPath, filterFiles) {
  return new Promise(async (resolve, reject) => {
    var files = await getFiles(buildPath);
    files = files.filter(f => {
      f = path.relative(process.env.BUILDPATH, f);
      return (
        f.indexOf("node_modules") === -1 && f.indexOf("zero-builds") === -1
      );
    });
    // debug("files", files)
    var deps = [];

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
      if (
        path.relative(process.env.BUILDPATH, file).toLowerCase() ===
        "package.json"
      ) {
        pkgJsonChanged = true;
      }

      // extract imports
      deps = deps.concat(getPackages(file));
    });

    deps = deps.filter(function(item, pos) {
      return deps.indexOf(item) == pos;
    });

    // check if these deps are already installed
    var pkgjsonPath = path.join(buildPath, "/package.json");
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
      } catch (e) {}
    }
    if (!allInstalled || firstRun || pkgJsonChanged) {
      debug("yarn install hit", !!allInstalled, !!firstRun, !!pkgJsonChanged);
      // we must run npm i on first boot,
      // so we are sure pkg.json === node_modules
      firstRun = false;

      // now that we have a list. npm install them in our build folder
      await writePackageJSON(buildPath, deps);
      debug("installing", deps);

      runYarn(buildPath, ["install"]).then(() => {
        // installed
        debug("Pkgs installed successfully.");
        resolve(deps);
      });
    } else {
      resolve(deps);
    }
  });
}

async function writePackageJSON(buildPath, deps) {
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
  var depsJson = process.env.ISBUILDER
    ? commonDeps.dependencies()
    : commonDeps.dependenciesWithLocalPaths();

  if (pkg.dependencies) {
    Object.keys(depsJson).forEach(key => {
      pkg.dependencies[key] = depsJson[key];
    });
  } else {
    pkg.dependencies = depsJson;
  }

  // append user's imported packages (only if not already defined in package.json)
  for (var i in deps) {
    const dep = deps[i];
    if (!pkg.dependencies[dep]) {
      newDepsFound = true;
      pkg.dependencies[dep] = await getNPMVersion(dep);
    }
  }

  // write a pkg.json into tmp buildpath
  fs.writeFileSync(
    path.join(buildPath, "/package.json"),
    JSON.stringify(pkg, null, 2),
    "utf8"
  );

  // // merge babelrc with user's babelrc (if present in user project)
  var babelPath = path.join(buildPath, "/.babelrc");
  var babelSrcPath = path.join(process.env.SOURCEPATH, "/.babelrc");
  var finalBabelConfig = {};
  if (fs.existsSync(babelSrcPath)) {
    try {
      var userBabelConfig = JSON.parse(fs.readFileSync(babelSrcPath));
      finalBabelConfig = deepmerge(babelConfig, userBabelConfig);
    } catch (e) {
      // couldn't read the file
      finalBabelConfig = babelConfig;
    }
  } else {
    finalBabelConfig = babelConfig;
  }

  //console.log(JSON.stringify(finalBabelConfig, null, 2))
  fs.writeFileSync(
    babelPath,
    JSON.stringify(finalBabelConfig, null, 2),
    "utf8"
  );

  var htmlnanoPath = path.join(buildPath, "/.htmlnanorc");
  var htmlnanoSrcPath = path.join(process.env.SOURCEPATH, "/.htmlnanorc");
  // only write htmlnano file if not overriden by user
  if (!fs.existsSync(htmlnanoSrcPath)) {
    fs.writeFileSync(
      htmlnanoPath,
      JSON.stringify(htmlnanoConfig, null, 2),
      "utf8"
    );
  }

  // also save any newfound deps into user's pkg.json
  // in sourcepath. But minus our hardcoded depsJson

  if (newDepsFound) {
    Object.keys(depsJson).forEach(key => {
      delete pkg.dependencies[key];
    });
    console.log(`\x1b[2mUpdating package.json\x1b[0m\n`);
    fs.writeFileSync(
      path.join(process.env.SOURCEPATH, "/package.json"),
      JSON.stringify(pkg, null, 2),
      "utf8"
    );
  }
}

module.exports = installPackages;
