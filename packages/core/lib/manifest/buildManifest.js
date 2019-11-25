const glob = require("fast-glob");
const fs = require("fs");
const path = require("path");
const debug = require("debug")("core");
const slash = require("../utils/fixPathSlashes");
const builders = require("zero-builders-map");
const nodeignore = require("../utils/zeroignore");
const fileToPageType = require("../utils/fileToPageType");
const pythonFirstRun = require("zero-handlers-map").handlers["page:python"]
  .firstrun;
var pythonFirstRunCompleted = false;

var getPageID = function(path) {
  return require("crypto")
    .createHash("sha1")
    .update(path)
    .digest("hex");
};

async function getFiles(baseSrc) {
  return glob(path.join(baseSrc, "/**"), {
    onlyFiles: true,
    dot: true,
    ignore: ["**/node_modules/**", "**/.zero/**"]
  });
}

const relativePath = p => path.relative(process.env.SOURCEPATH, p);

async function buildManifest(buildPath, oldManifest, fileFilter) {
  buildPath = buildPath.endsWith("/") ? buildPath : buildPath + "/";
  var zeroignore = nodeignore();

  var date = Date.now();
  var files = await getFiles(buildPath);
  files = files.filter(
    file =>
      !relativePath(file).startsWith("node_modules/") &&
      !relativePath(file).startsWith("zero-builds/") &&
      !relativePath(file).startsWith(".zero/")
  );

  debug("filterDone", files.length);

  var json = await Promise.all(
    files.map(async file => {
      const extension = path.extname(file);
      file = path.normalize(file);
      file = slash(file);
      // if old manifest is given and a file filter is given, we skip those not in filter
      if (oldManifest && fileFilter && fileFilter.length) {
        if (fileFilter.indexOf(file) === -1) {
          var page = oldManifest.pages.find(page => {
            return page.entryFile === file;
          });
          debug("skipping", file, !!page);
          if (page) return { entryFile: file, type: page.type };
          else return false;
        }
      }
      // first check if filename (or the folder it resides in) is in zeroignore, ignore those.
      var fileRelative = relativePath(file);
      if (zeroignore.ignores(fileRelative)) return false;

      switch (extension) {
        // for all these extensions just return page type
        case ".js":
        case ".ts":
        case ".jsx":
        case ".tsx":
        case ".mdx":
        case ".md":
        case ".vue":
        case ".html":
        case ".htm":
        case ".svelte":
          return { entryFile: file, type: fileToPageType(file) };

        // Python page needs to run this additional step once
        case ".py":
          // also run python first run if not run already
          if (!pythonFirstRunCompleted) {
            pythonFirstRun(buildPath).catch(e => console.error(e));
            pythonFirstRunCompleted = true;
          }
          return { entryFile: file, type: fileToPageType(file) };

        // .json can be a proxy path.
        case ".json":
          // check if this is a proxy path
          // avoid reading large json files as they are likely not our proxy path config
          if (fs.statSync(file).size < 10 * 1024) {
            try {
              var json = JSON.parse(fs.readFileSync(file, "utf8"));
              if (json && json.type && json.type === "proxy") {
                return { entryFile: file, type: fileToPageType(file) };
              }
            } catch (e) {} // bad json probably, skip
          }

        // catch all, static / cdn hosting
        default:
          return false;
      }
    })
  );

  debug("elaps", (Date.now() - date) / 1000);

  var pages = json
    // remove empty elements
    .filter(page => {
      return page !== false;
    })

    // add page path at 0 position for each page
    .map(page => {
      var trimmedPath = "/" + slash(path.relative(buildPath, page.entryFile));
      trimmedPath = trimmedPath
        .split(".")
        .slice(0, -1) // remove extension
        .join(".")
        // lowercase path except $paramNames
        .split("/")
        .map(p => {
          if (!p.startsWith("$")) return p.toLowerCase();
          return p;
        })
        .join("/");
      trimmedPath = encodeURI(trimmedPath);
      if (trimmedPath.endsWith("/index")) {
        trimmedPath = trimmedPath
          .split("/index")
          .slice(0, -1)
          .join("/index"); // remove extension
      }

      page["path"] = trimmedPath;
      page["id"] = getPageID(trimmedPath);
      return page;
    });

  // get all related files (imports/requires) of this page
  pages = pages.map(page => {
    page["relatedFiles"] = [page.entryFile].concat(
      dependencyTree(page.type, page.entryFile)
    );
    return page;
  });

  // generate a (file -> page) index ie. all the pages that use that file.
  // this is useful when a file is changed and we need to rebuild all the
  // pages depending on that file.
  var fileToPages = {};
  pages.forEach(page => {
    page.relatedFiles.forEach(file => {
      fileToPages[file] = fileToPages[file] || [];
      fileToPages[file].push(page.entryFile);
    });
  });

  return { pages, fileToPages };
}

// get all relative files imported by this entryFile
function dependencyTree(type, entryFile) {
  const buildersType = builders[type];

  if (buildersType && require(buildersType).getRelatedFiles) {
    return require(buildersType).getRelatedFiles(entryFile);
  } else {
    return []; //no tree walker found for this page type
  }
}

module.exports = buildManifest;
