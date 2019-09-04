/*
 When a user hits a url which is a lambda, the router starts a new 
 http server in a separate child process. The child process returns the port.
 The router then proxies the request to that server.
 The router also maintains a map {} to avoid creating new processes for
 same url when it's hit again.

 Static files are handled in the current process.
*/

const express = require("express");
const compression = require("compression");
const matchPath = require("./matchPath");
const path = require("path");
const url = require("url");
const { handlers, getHandler } = require("zero-handlers-map");
const builders = require("zero-builders-map");
const staticHandler = handlers["static"].handler;
const fs = require("fs");
const debug = require("debug")("core");
const ora = require("ora");
const fork = require("child_process").fork;
const bundlerProgram = require.resolve("zero-builder-process");

var lambdaIdToHandler = {}; // for proxy paths, this holds their handler(req, res)
var lambdaIdToBundleInfo = {}; // holds bundle info for each lambda if generated or it generates one
var updatedManifest = false;

var getLambdaID = function(entryFile) {
  return require("crypto")
    .createHash("sha1")
    .update(entryFile)
    .digest("hex");
};

async function proxyLambdaRequest(req, res, endpointData) {
  const spinner = ora({
    color: "green",
    spinner: "star"
  });
  if (!process.env.SERVERADDRESS) {
    process.env.SERVERADDRESS = "http://" + req.headers.host;
  }
  var lambdaID = getLambdaID(endpointData[0]);

  if (
    !lambdaIdToBundleInfo[lambdaID] &&
    builders[endpointData[2]] &&
    builders[endpointData[2]].bundler
  ) {
    //debug("build not found", lambdaID, endpointData[0])
    spinner.start("Building " + url.resolve("/", endpointData[0]));
    await getBundleInfo(endpointData);
    spinner.start("Serving " + url.resolve("/", endpointData[0]));
  }

  // generate a handler if not generated previously
  if (!lambdaIdToHandler[lambdaID]) {
    const handlerApp = await getHandler(endpointData[2]);
    lambdaIdToHandler[lambdaID] = await handlerApp([
      endpointData[0],
      endpointData[1],
      endpointData[2],
      process.env.SERVERADDRESS,
      "zero-builds/" + lambdaID,
      lambdaIdToBundleInfo[lambdaID] ? lambdaIdToBundleInfo[lambdaID].info : ""
    ]);
  }
  if (spinner.isSpinning) {
    spinner.succeed(url.resolve("/", endpointData[0]) + " ready");
  }
  return lambdaIdToHandler[lambdaID](req, res);
}

// if server exits, kill the child processes too.
process.on("SIGTERM", cleanProcess);
process.on("exit", cleanProcess);

function cleanProcess() {
  for (var id in lambdaIdToBundleInfo) {
    if (lambdaIdToBundleInfo[id].process)
      lambdaIdToBundleInfo[id].process.kill();
  }
}

function getBundleInfo(endpointData) {
  return new Promise(async (resolve, reject) => {
    const lambdaID = getLambdaID(endpointData[0]);
    if (lambdaIdToBundleInfo[lambdaID])
      return resolve(lambdaIdToBundleInfo[lambdaID]);

    if (!bundlerProgram) return resolve(false);
    const parameters = [
      endpointData[0],
      endpointData[1],
      endpointData[2],
      "zero-builds/" + lambdaID
    ];
    const options = {
      stdio: [0, 1, 2, "ipc"]
    };

    const child = fork(bundlerProgram, parameters, options);
    child.on("message", message => {
      lambdaIdToBundleInfo[lambdaID] = { info: message, process: child };
      return resolve(lambdaIdToBundleInfo[lambdaID]);
    });

    child.on("close", () => {
      debug("bundler process closed", lambdaID);
      delete lambdaIdToBundleInfo[lambdaID];
    });
  });
}

// a promise to keep waiting until manifest is available.
function waitForManifest() {
  return new Promise((resolve, reject) => {
    var interval = setInterval(() => {
      if (updatedManifest) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
}

module.exports = buildPath => {
  const app = express();

  // compress all responses
  app.use(compression({ threshold: 1 }));

  var manifest = { lambdas: [], fileToLambdas: {} };
  var forbiddenStaticFiles = [];
  app.all("*", async (request, response) => {
    // don't serve requests until first manifest is available
    if (!updatedManifest) await waitForManifest();

    var endpointData = matchPath(
      manifest,
      forbiddenStaticFiles,
      buildPath,
      request.url
    );
    debug("match", request.url, endpointData);
    if (endpointData === "404") {
      return response.sendStatus(404);
    }
    if (endpointData) {
      // call relevant handler as defined in manifest
      return proxyLambdaRequest(request, response, endpointData);
    }
    // catch all handler
    return staticHandler(request, response);
  });

  var listener = app.listen(process.env.PORT, () => {
    debug("Running on port", listener.address().port);
  });

  return (newManifest, newForbiddenFiles, filesUpdated) => {
    debug("updating manifest in server");
    manifest = newManifest;
    forbiddenStaticFiles = newForbiddenFiles;

    if (!updatedManifest) {
      // this is first update of manifest
      updatedManifest = true;

      // try to load build-info from file (if generated using 'zero build' command)
      try {
        var file = fs.readFileSync(
          path.join(buildPath, "/zero-builds/build-info.json"),
          "utf8"
        );
        lambdaIdToBundleInfo = JSON.parse(file);
        //console.log("loading build info with ", Object.keys(lambdaIdToBundleInfo).length, "keys")
      } catch (e) {
        // file is probably not present, ignore
      }
    }

    // kill and restart servers
    if (filesUpdated) {
      // find out which lambdas need updating due to this change
      var lambdasUpdated = {};
      filesUpdated.forEach(file => {
        var lambdaEntryFiles = manifest.fileToLambdas[file];
        if (!lambdaEntryFiles) return;
        lambdaEntryFiles.forEach(file => (lambdasUpdated[file] = true));
      });

      // update each lambda
      Object.keys(lambdasUpdated).forEach(async lambdaEntryFile => {
        var endpointData = newManifest.lambdas.find(lambda => {
          return lambda[1] === lambdaEntryFile;
        });
        var lambdaID = getLambdaID(endpointData[0]);

        if (lambdaIdToHandler[lambdaID]) {
          delete lambdaIdToHandler[lambdaID];
        }
      });
    }
  };
};
