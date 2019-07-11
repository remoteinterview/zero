const glob = require("fast-glob");
const fs = require("fs");
const path = require("path");
const debug = require("debug")("core");
const slash = require("../utils/fixPathSlashes");
const handlers = require("zero-handlers-map");
const builders = require("zero-builders-map");
const nodeignore = require("../utils/zeroignore");
const pythonFirstRun = require("zero-handlers-map")["lambda:python"].firstrun;
var pythonFirstRunCompleted = false;

async function getFiles(baseSrc) {
  //baseSrc = baseSrc.endsWith("/")?baseSrc:(baseSrc+"/")
  return glob(path.join(baseSrc, "/**"), { onlyFiles: true, dot: true });
}

const relativePath = p => path.relative(process.env.BUILDPATH, p);

async function buildManifest(buildPath, oldManifest, fileFilter) {
  buildPath = buildPath.endsWith("/") ? buildPath : buildPath + "/";
  var zeroignore = nodeignore();

  var date = Date.now();
  var files = await getFiles(buildPath);
  files = files.filter(
    f =>
      relativePath(f).indexOf("node_modules") === -1 &&
      relativePath(f).indexOf("zero-builds") === -1
  );

  var json = await Promise.all(
    files.map(async (file, i) => {
      const extension = path.extname(file);
      file = path.normalize(file);
      // if old manifest is given and a file filter is given, we skip those not in filter
      if (oldManifest && fileFilter && fileFilter.length > 0) {
        var normalizedFile = file;
        if (fileFilter.indexOf(normalizedFile) === -1) {
          var endpoint = oldManifest.lambdas.find(lambda => {
            return lambda[1] === normalizedFile;
          });
          debug("skipping", normalizedFile, !!endpoint);
          if (endpoint) return [file, endpoint[2]];
          else return false;
        }
      }
      // first check if filename (or the folder it resides in) is in zeroignore, ignore those.
      var fileRelative = relativePath(file);
      if (zeroignore.ignores(fileRelative)) return false;

      // check if js file is a js lambda function
      if (extension === ".js" || extension === ".ts") {
        return [file, "lambda:js"];
      }

      // check if a react component
      // md/mdx is also rendered by react lambda
      if (
        extension === ".jsx" ||
        extension === ".tsx" ||
        extension === ".mdx" ||
        extension === ".md"
      ) {
        return [file, "lambda:react"];
      }

      if (extension === ".vue") {
        return [file, "lambda:vue"];
      }

      // Python Lambda
      if (extension === ".py") {
        // also run python first run if not run already
        if (!pythonFirstRunCompleted) {
          pythonFirstRun(buildPath).catch(e => console.error(e));
          pythonFirstRunCompleted = true;
        }
        return [file, "lambda:python"];
      }

      if (extension === ".htm" || extension === ".html") {
        return [file, "lambda:html"];
      }

      // catch all, static / cdn hosting
      return false;
    })
  );

  debug("elaps", (Date.now() - date) / 1000);

  var lambdas = json
    // remove empty elements
    .filter(endpoint => {
      return endpoint !== false;
    })

    // add endpoint path at 0 position for each lambda
    .map(endpoint => {
      var trimmedPath = slash(endpoint[0]).replace(buildPath, "/");
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
      if (trimmedPath.endsWith("/index")) {
        trimmedPath = trimmedPath
          .split("/index")
          .slice(0, -1)
          .join("/index"); // remove extension
      }

      endpoint.unshift(trimmedPath);
      return endpoint;
    });

  // get all related files (imports/requires) of this lambda
  lambdas = lambdas.map(endpoint => {
    endpoint.push(
      [endpoint[1]].concat(dependencyTree(endpoint[2], endpoint[1]))
    );
    return endpoint;
  });

  // generate a (file -> lambda) index ie. all the lambdas that use that file.
  // this is useful when a file is changed and we need to rebuild all the
  // lambdas depending on that file.
  var fileToLambdas = {};
  lambdas.forEach((endpoint, i) => {
    endpoint[3].forEach(file => {
      fileToLambdas[file] = fileToLambdas[file] || [];
      fileToLambdas[file].push(endpoint[1]);
    });
  });

  return { lambdas, fileToLambdas };
}

// get all relative files imported by this entryFile
function dependencyTree(type, entryFile) {
  // console.log("deptree?", type, builders[type])
  if (builders[type].getRelatedFiles)
    return builders[type].getRelatedFiles(entryFile);
  else return []; //no tree walker found for this lambda type
}

module.exports = buildManifest;
