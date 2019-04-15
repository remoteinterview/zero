const getPackages = require("zero-dep-tree-js").getPackages;
const fs = require("fs");
var glob = require("fast-glob");
//var { spawnSync } = require("child_process")
//const npminstall = require('npminstall');
var npmi = require("npmi");
var npm = require("global-npm");
// const pnpm = require('pnpm/lib/main').default
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

    // see if we need to include additional optional deps.
    files.forEach(file => {
      if (
        deps.indexOf("typescript") === -1 &&
        (path.extname(file) === ".ts" || path.extname(file) === ".tsx")
      ) {
        deps.push("typescript");
      }

      if (deps.indexOf("vue") === -1 && path.extname(file) === ".vue") {
        deps.push("vue", "vue-hot-reload-api", "vue-meta");
      }
    });

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
    if (!allInstalled || firstRun) {
      // we must run npm i on first boot,
      // so we are sure pkg.json === node_modules
      firstRun = false;

      // now that we have a list. npm install them in our build folder
      await writePackageJSON(buildPath, deps);
      debug("installing", deps);

      var options = {
        path: buildPath, // installation path [default: '.']
        npmLoad: {
          // npm.load(options, callback): this is the "options" given to npm.load()
          //loglevel: 'silent',	// [default: {loglevel: 'silent'}]
          //loglevel: "verbose",
          progress: false,
          "prefer-offline": true,
          audit: false
        }
      };
      npmi(options, function(err, result) {
        if (err) {
          if (err.code === npmi.LOAD_ERR) debug("npm load error");
          else if (err.code === npmi.INSTALL_ERR) debug("npm install error");
          reject(err);
          return debug("errr", err.message);
        }

        // installed
        debug("Pkgs installed successfully.");
        resolve(deps);
      });

      // try{
      //   await pnpm(["install", "--loglevel", "warn", "--prefix", buildPath])
      //   // installed
      //   debug('Pkgs installed successfully.');
      //   resolve()

      // }
      // catch(e){
      //   reject(e)
      // }
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
  var depsJson = {
    react: "^16.8.1",
    "react-dom": "^16.8.1",
    // "babel-core": "^6.26.0",
    // "babel-polyfill": "^6.26.0",
    //"babel-loader": "^7.1.5",
    "react-helmet": "^5.2.0",
    // "@babel/polyfill": "^7.2.5",
    "@babel/runtime": "^7.3.1",
    "regenerator-runtime": "^0.12.0",

    sass: "^1.17.2",
    "postcss-modules": "1.4.1",
    cssnano: "4.1.10",

    "react-hot-loader": "^4.6.5",
    // "object-assign":"^4.1.1",
    // "prop-types":"^15.7.2",
    // "scheduler":"^0.13.3",

    "@mdx-js/tag": "^0.16.8",
    "@babel/plugin-transform-runtime": "^7.2.0",
    "@babel/plugin-proposal-class-properties": "^7.3.4",
    "babel-plugin-react-require": "^3.1.1",
    "@babel/core": "^7.2.2"
    // "@babel/core": "^7.2.2",

    // "babel-loader": "^8.0.5",
    // "css-loader": "2.1.0",
    // "file-loader": "3.0.1",
    // "node-sass": "4.11.0",
    // "sass-loader": "7.1.0",
    // "style-loader": "0.23.1",
    // "url-loader": "1.1.2",
    // "mini-css-extract-plugin": "^0.5.0",
    // "@mdx-js/loader": "^0.16.8"
  };

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
  // deps.forEach(dep => {

  // });

  // write a pkg.json into tmp buildpath
  fs.writeFileSync(
    path.join(buildPath, "/package.json"),
    JSON.stringify(pkg, null, 2),
    "utf8"
  );

  // // write .babelrc
  fs.writeFileSync(
    path.join(buildPath, "/.babelrc"),
    JSON.stringify(babelConfig, null, 2),
    "utf8"
  );

  // also save any newfound deps into user's pkg.json
  // in sourcepath. But minus our hardcoded depsJson

  if (newDepsFound) {
    Object.keys(depsJson).forEach(key => {
      delete pkg.dependencies[key];
    });
    console.log(`\n\x1b[2mUpdating package.json\x1b[0m\n`);
    fs.writeFileSync(
      path.join(process.env.SOURCEPATH, "/package.json"),
      JSON.stringify(pkg, null, 2),
      "utf8"
    );
  }
}

function getNPMVersion(pkgName) {
  return new Promise((resolve, reject) => {
    npm.load({}, err => {
      //process.stdout.write(`\x1b[2m- Resolving ${pkgName}@`)
      npm.commands.show([pkgName, "version"], (err, view) => {
        //process.stdout.write('\x1b[0m')
        try {
          resolve(`^${Object.keys(view)[0]}`);
        } catch (e) {
          resolve("latest");
        }
      });
    });
  });
}

module.exports = installPackages;
