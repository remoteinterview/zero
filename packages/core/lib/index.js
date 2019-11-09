const build = require("./builder");
const startRouter = require("./router");
const Queue = require("p-queue").default;
const path = require("path");
const fs = require("fs");
const del = require("del");
const debug = require("debug")("core");
const mkdirp = require("mkdirp");
const slash = require("./utils/fixPathSlashes");
const pkg = require("../package");
const FileHash = require("./utils/fileHash");

function resolveYarn() {
  var yPath;
  try {
    var p = require.resolve("yarn/bin/yarn");
    if (p) {
      yPath = path.dirname(p);
    }
  } catch (e) {}

  // fallback
  if (!yPath) {
    yPath = path.join(__dirname, "..", "node_modules", "yarn", "bin");
  }

  return yPath;
}

function setupEnvVariables(sourcePath) {
  // Load environment variables from .env file if present
  debug("sourcePath", sourcePath);
  require("dotenv").config({ path: path.resolve(sourcePath, ".env") });
  // Default env variables.
  process.env.PATH += ":" + resolveYarn();
  // we resolve the absolute path of source directory to avoid confusion in bundlers and handlers
  process.env.SOURCEPATH = slash(path.resolve(sourcePath));
  const DEFAULTBUILDPATH = path.join(process.env.SOURCEPATH, ".zero");
  process.env.PORT = process.env.PORT || 3000;
  process.env.SESSION_TTL =
    process.env.SESSION_TTL || 1000 * 60 * 60 * 24 * 365; // 1 year
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || "k3yb0Ard c@t";
  process.env.BUILDPATH = slash(process.env.BUILDPATH || DEFAULTBUILDPATH);

  // create the build folder if not present already
  mkdirp.sync(process.env.BUILDPATH);
  // mkdirp.sync(path.join(process.env.BUILDPATH, ".zero"));
}

process.on("SIGINT", function() {
  //graceful shutdown
  process.exit();
});

async function server(sourcePath) {
  setupEnvVariables(sourcePath);
  console.log(`\x1b[2m⚡️ Zero ${pkg.version ? `v${pkg.version}` : ""}\x1b[0m`);
  var updateManifestFn = startRouter(
    /*manifest, forbiddenFiles,*/ process.env.SOURCEPATH
  );

  // clear any `zero build` configs to avoid confusion
  var buildConfigPath = path.join(
    process.env.BUILDPATH,
    "zero-builds",
    "_config"
  );
  if (fs.existsSync(buildConfigPath)) {
    await del([slash(path.join(buildConfigPath, "/**"))], {
      force: true
    });
  }
  return new Promise((resolve, reject) => {
    build(
      sourcePath,
      process.env.BUILDPATH,
      (manifest, forbiddenFiles, filesUpdated) => {
        updateManifestFn(manifest, forbiddenFiles, filesUpdated);
        resolve();
      }
    );
  });
}

// Build beforehand
const fork = require("child_process").fork;
const bundlerProgram = require.resolve("zero-builder-process");

function getBundleInfo(endpointData) {
  return new Promise(async (resolve, reject) => {
    if (!bundlerProgram) return resolve(false);
    const parameters = [
      endpointData.path,
      endpointData.entryFile,
      endpointData.type,
      ".zero/zero-builds/" + endpointData.id
    ];
    const options = {
      stdio: [0, 1, 2, "ipc"]
    };

    const child = fork(bundlerProgram, parameters, options);
    child.on("message", message => {
      resolve(message);
    });
  });
}

function builder(sourcePath) {
  const buildStartTime = Date.now();
  process.env.ISBUILDER = "true";
  process.env.NODE_ENV = "production";
  console.log(`\x1b[2m⚡️ Zero ${pkg.version ? `v${pkg.version}` : ""}\x1b[0m`);
  var bundleInfoMap = {};
  setupEnvVariables(sourcePath);

  return new Promise((resolve, reject) => {
    build(
      sourcePath,
      process.env.BUILDPATH,
      async (manifest, forbiddenFiles, filesUpdated, dependencies) => {
        // generate hashes of all files related to lambda
        var fileHashes = {};
        for (var file in manifest.fileToLambdas) {
          fileHashes[file] = [
            await FileHash(file),
            manifest.fileToLambdas[file].map(entryFile => {
              var endpointData = manifest.lambdas.find(lambda => {
                return lambda.entryFile === entryFile;
              });
              return endpointData.id;
            })
          ];
        }

        var pastFileHashes = false;
        var pastBuildInfoMap = false;
        var fileHashPath = path.join(
          process.env.BUILDPATH,
          "zero-builds",
          "_config",
          "hashes.json"
        );

        var buildInfoMapPath = path.join(
          process.env.BUILDPATH,
          "zero-builds",
          "build-info.json"
        );

        try {
          if (fs.existsSync(fileHashPath) && fs.existsSync(buildInfoMapPath)) {
            pastBuildInfoMap = require(buildInfoMapPath);
            pastFileHashes = require(fileHashPath);

            //console.log("using previous zero-builds", pastFileHashes)
          }
        } catch (e) {}

        // build paths in a queue with concurrency
        var queue = new Queue({
          concurrency: parseInt(process.env.BUILDCONCURRENCY) || 2
        });

        // see if we can use past zero-build to only build diff
        var filterLambdas = false;
        if (pastFileHashes) {
          filterLambdas = {};
          Object.keys(fileHashes).forEach(file => {
            if (
              !pastFileHashes[file] || // a new lambda that didn't exist before
              fileHashes[file][0] !== pastFileHashes[file][0] // lambda changed
            ) {
              // mark this lambda to be dirty
              manifest.fileToLambdas[file].forEach(lambda => {
                filterLambdas[lambda] = true;
              });
            }
          });

          // check if any of the lambda was removed in new build
          // lambda builds that don't exist in new build should be deleted.
          for (var file in pastFileHashes) {
            if (!fileHashes[file]) {
              for (var index in pastFileHashes[file][1]) {
                try {
                  var lambdaID = pastFileHashes[file][1][index];
                  debug("deleting", file, pastFileHashes[file][1], lambdaID);
                  await del(
                    [
                      slash(
                        path.join(
                          process.env.BUILDPATH,
                          "zero-builds",
                          lambdaID,
                          "/**"
                        )
                      )
                    ],
                    {
                      force: true
                    }
                  );
                } catch (e) {}
              }
            }
          }
        }

        for (var i in manifest.lambdas) {
          queue.add(
            async function(index) {
              var endpointData = manifest.lambdas[index];
              var lambdaID = endpointData.id;
              if (
                filterLambdas &&
                !filterLambdas[endpointData.enryFile] &&
                pastBuildInfoMap[lambdaID]
              ) {
                console.log(
                  `\x1b[2m[${~~index + 1}/${manifest.lambdas.length}] Skipping`,
                  endpointData.path || "/",
                  `\x1b[0m`
                );
                bundleInfoMap[lambdaID] = pastBuildInfoMap[lambdaID];
                return;
              }

              console.log(
                `[${~~index + 1}/${manifest.lambdas.length}] Building`,
                endpointData.path || "/"
              );
              var info = await getBundleInfo(endpointData);
              bundleInfoMap[lambdaID] = { info }; //the router needs the data at .info of each key
            }.bind(this, i)
          );
        }

        await queue.onIdle();
        debug("bundleInfo", bundleInfoMap);
        mkdirp.sync(path.join(process.env.BUILDPATH, "zero-builds"));
        fs.writeFileSync(
          path.join(process.env.BUILDPATH, "zero-builds", "build-info.json"),
          JSON.stringify(bundleInfoMap),
          "utf8"
        );

        // copy package.json
        mkdirp.sync(path.join(process.env.BUILDPATH, "zero-builds", "_config"));

        fs.writeFileSync(
          path.join(
            process.env.BUILDPATH,
            "zero-builds",
            "_config",
            "package.json"
          ),
          fs.readFileSync(path.join(process.env.SOURCEPATH, "package.json"))
        );

        // copy .babelrc
        fs.writeFileSync(
          path.join(
            process.env.BUILDPATH,
            "zero-builds",
            "_config",
            ".babelrc"
          ),
          fs.readFileSync(path.join(process.env.SOURCEPATH, ".babelrc"))
        );

        // save a file hash map
        fs.writeFileSync(fileHashPath, JSON.stringify(fileHashes));

        console.log(
          `\x1b[2mBuilt in ${((Date.now() - buildStartTime) / 1000).toFixed(
            1
          )} seconds.\x1b[0m`
        );

        // resolve with manifest
        resolve({ manifest, forbiddenFiles, dependencies });
      },
      true
    );
  });
}

module.exports = {
  server: server,
  build: builder
};
