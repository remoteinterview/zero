/*
 When a user hits a url which is a page (not static file), the router starts a new 
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
const getBuildInfo = require("../utils/getBuildInfo");

var pageIdToHandler = {}; // for proxy paths, this holds their handler(req, res)
var pageIdToBundleInfo = {}; // holds bundle info for each page if generated or it generates one
var updatedManifest = false;

async function handlePageRequest(req, res, pageData) {
  const spinner = ora({
    color: "green",
    spinner: "star"
  });
  if (!process.env.SERVERADDRESS) {
    process.env.SERVERADDRESS = "http://" + req.headers.host;
  }
  var pageId = pageData.id;

  if (
    !pageIdToBundleInfo[pageId] &&
    builders[pageData.type] &&
    require(builders[pageData.type]).bundler
  ) {
    //debug("build not found", pageId, pageData.path)
    spinner.start("Building " + url.resolve("/", pageData.path));
    await getBuildInfoCached(pageData);
    spinner.start("Serving " + url.resolve("/", pageData.path));
  }

  // generate a handler if not generated previously
  if (!pageIdToHandler[pageId]) {
    const handlerApp = await getHandler(pageData.type);
    pageIdToHandler[pageId] = await handlerApp(
      pageData,
      pageIdToBundleInfo[pageId] ? pageIdToBundleInfo[pageId].info : ""
    );
  }
  if (spinner.isSpinning) {
    spinner.succeed(url.resolve("/", pageData.path) + " ready");
  }
  return pageIdToHandler[pageId](req, res);
}

// if server exits, kill the child processes too.
process.on("SIGTERM", cleanProcess);
process.on("exit", cleanProcess);

function cleanProcess() {
  for (var id in pageIdToBundleInfo) {
    if (pageIdToBundleInfo[id].process) pageIdToBundleInfo[id].process.kill();
  }
}
async function getBuildInfoCached(pageData) {
  const pageId = pageData.id;
  if (pageIdToBundleInfo[pageId]) return pageIdToBundleInfo[pageId];

  var { child, info } = await getBuildInfo(pageData, () => {
    delete pageIdToBundleInfo[pageId];
  });

  if (!info) return false;
  pageIdToBundleInfo[pageId] = {
    info: info,
    process: child,
    created: Date.now(),
    path: pageData.path
  };
  checkForBundlerCleanup();
  return pageIdToBundleInfo[pageId];
}

// shutdown older than N bundlers.
// this feature is only available in dev mode
// (and currently enabled only by env flag)
// this is useful in tests, when 10s of bundlers are starting
// and sitting idle, taking memory, and slowing tests overall.
function checkForBundlerCleanup() {
  if (process.env.ZERO_LIMIT_BUNDLERS) {
    var lastN = parseInt(process.env.ZERO_LIMIT_BUNDLERS);
    if (lastN <= 0) lastN = 10;
    var arr = Object.keys(pageIdToBundleInfo)
      .map(pageId => {
        return { ...pageIdToBundleInfo[pageId], id: pageId };
      })
      .sort((a, b) => {
        return a.created > b.created;
      });

    if (arr.length > lastN) {
      // kill older than N
      arr = arr.slice(0, arr.length - lastN);
      arr.forEach(data => {
        if (data.process) {
          debug(
            "killing bundler",
            data.path,
            pageIdToBundleInfo[data.id].process.pid
          );
          pageIdToBundleInfo[data.id].process.kill();
          delete pageIdToBundleInfo[data.id];
          delete pageIdToHandler[data.id]; // handler will need new bundleInfo too
        }
      });
    }
  }
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

module.exports = (buildPath, manifestEvents) => {
  const app = express();

  // compress all responses
  app.use(compression({ threshold: 1 }));

  // replace powered-by header
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.header("x-powered-by", "ZeroServer");
    next();
  });

  var manifest = { pages: [], fileToPages: {} };
  var forbiddenStaticFiles = [];
  app.all("*", async (request, response) => {
    // don't serve requests until first manifest is available
    if (!updatedManifest) await waitForManifest();

    var pageData = matchPath(
      manifest,
      forbiddenStaticFiles,
      buildPath,
      request.url
    );
    debug("match", request.url, pageData);
    if (pageData === "404") {
      return response
        .status(404)
        .send(
          process.env.NODE_ENV === "production"
            ? "Not Found"
            : "<center style='font-family: monospace;'><h1>Nothing Here</h1><br/>Did you forget to add the file for this path?</center>"
        );
    }
    if (pageData) {
      // call relevant handler as defined in manifest
      return handlePageRequest(request, response, pageData);
    }
    // catch all handler
    return staticHandler(request, response);
  });

  manifestEvents.on("change", changedData => {
    debug("updating manifest in server");
    manifest = changedData.manifest;
    forbiddenStaticFiles = changedData.forbiddenFiles;

    if (!updatedManifest) {
      // this is first update of manifest
      updatedManifest = true;

      // try to load build-info from file (if generated using 'zero build' command)
      try {
        var file = fs.readFileSync(
          path.join(process.env.BUILDPATH, "zero-builds", "build-info.json"),
          "utf8"
        );
        pageIdToBundleInfo = JSON.parse(file);
      } catch (e) {
        // file is probably not present, ignore
      }
    }

    // kill and restart servers
    if (changedData.filesUpdated) {
      // find out which pages need updating due to this change
      var pagesUpdated = {};
      changedData.filesUpdated.forEach(file => {
        var pageEntryFiles = manifest.fileToPages[file];
        if (!pageEntryFiles) return;
        pageEntryFiles.forEach(file => (pagesUpdated[file] = true));
      });

      // update each page
      Object.keys(pagesUpdated).forEach(async pageEntryfile => {
        var pageData = changedData.manifest.pages.find(page => {
          return page.entryFile === pageEntryfile;
        });
        var pageId = pageData.id;

        if (pageIdToHandler[pageId]) {
          delete pageIdToHandler[pageId];
        }
      });
    }
  });

  return app;
};
