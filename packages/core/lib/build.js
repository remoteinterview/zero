const Watcher = require("./utils/watcher");
const Manifest = require("./manifest");
const Queue = require("p-queue").default;
const path = require("path");
const fs = require("fs");
const del = require("del");
const debug = require("debug")("core");
const mkdirp = require("mkdirp");
const slash = require("./utils/fixPathSlashes");
const pkg = require("../package");
const FileHash = require("./utils/fileHash");
const setupEnvVariables = require("./utils/setupEnvVars");
const getBuildInfo = require("./utils/getBuildInfo");

function builder(sourcePath) {
  const buildStartTime = Date.now();

  // `zero build` is always run in production mode.
  process.env.ISBUILDER = "true";
  process.env.NODE_ENV = "production";

  console.log(`\x1b[2m⚡️ Zero ${pkg.version ? `v${pkg.version}` : ""}\x1b[0m`);
  var bundleInfoMap = {};
  setupEnvVariables(sourcePath);

  // create the build folder if not present already
  mkdirp.sync(process.env.BUILDPATH);

  var fileWatch = new Watcher(sourcePath, false);
  var manifest = new Manifest(sourcePath, fileWatch);

  return new Promise((resolve, reject) => {
    manifest.on(
      "change",
      async ({ manifest, forbiddenFiles, filesUpdated, dependencies }) => {
        // generate hashes of all files related to page
        var fileHashes = {};
        for (var file in manifest.fileToPages) {
          fileHashes[file] = [
            await FileHash(file),
            manifest.fileToPages[file].map(entryFile => {
              var pageData = manifest.pages.find(page => {
                return page.entryFile === entryFile;
              });
              return pageData.id;
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
        var filterPages = false;
        if (pastFileHashes) {
          filterPages = {};
          Object.keys(fileHashes).forEach(file => {
            if (
              !pastFileHashes[file] || // a new page that didn't exist before
              fileHashes[file][0] !== pastFileHashes[file][0] // page changed
            ) {
              // mark this page to be dirty
              manifest.fileToPages[file].forEach(page => {
                filterPages[page] = true;
              });
            }
          });

          // check if any of the page was removed in new build
          // page builds that don't exist in new build should be deleted.
          for (var file in pastFileHashes) {
            if (!fileHashes[file]) {
              for (var index in pastFileHashes[file][1]) {
                try {
                  var pageId = pastFileHashes[file][1][index];
                  debug("deleting", file, pastFileHashes[file][1], pageId);
                  await del(
                    [
                      slash(
                        path.join(
                          process.env.BUILDPATH,
                          "zero-builds",
                          pageId,
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

        for (var i in manifest.pages) {
          queue.add(
            async function(index) {
              var pageData = manifest.pages[index];
              var pageId = pageData.id;
              if (
                filterPages &&
                !filterPages[pageData.entryFile] &&
                pastBuildInfoMap[pageId]
              ) {
                console.log(
                  `\x1b[2m[${~~index + 1}/${manifest.pages.length}] Skipping`,
                  pageData.path || "/",
                  `\x1b[0m`
                );
                bundleInfoMap[pageId] = pastBuildInfoMap[pageId];
                return;
              }

              console.log(
                `[${~~index + 1}/${manifest.pages.length}] Building`,
                pageData.path || "/"
              );
              var { info } = await getBuildInfo(pageData);
              bundleInfoMap[pageId] = { info }; //the router needs the data at .info of each key
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
          fs.readFileSync(path.join(process.env.PROJECTPATH, "package.json"))
        );

        // copy .babelrc
        fs.writeFileSync(
          path.join(
            process.env.BUILDPATH,
            "zero-builds",
            "_config",
            ".babelrc"
          ),
          fs.readFileSync(path.join(process.env.PROJECTPATH, ".babelrc"))
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
      }
    );
  });
}

module.exports = builder;
