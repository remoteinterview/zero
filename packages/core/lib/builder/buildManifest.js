const glob = require("fast-glob");
const fs = require("fs");
const path = require("path");
const debug = require("debug")("core");
const slash = require("../utils/fixPathSlashes");
const builders = require("zero-builders-map");
const nodeignore = require("../utils/zeroignore");
const fileToLambda = require("../utils/fileToLambda");
const pythonFirstRun = require("zero-handlers-map").handlers["lambda:python"]
  .firstrun;
var pythonFirstRunCompleted = false;

var getLambdaID = function(path) {
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
        var normalizedFile = file;
        if (fileFilter.indexOf(normalizedFile) === -1) {
          var endpoint = oldManifest.lambdas.find(lambda => {
            return lambda.entryFile === normalizedFile;
          });
          debug("skipping", normalizedFile, !!endpoint);
          if (endpoint) return [file, endpoint.type];
          else return false;
        }
      }
      // first check if filename (or the folder it resides in) is in zeroignore, ignore those.
      var fileRelative = relativePath(file);
      if (zeroignore.ignores(fileRelative)) return false;

      switch (extension) {
        // for all these extensions just return lambda type
        case ".js":
        case ".ts":
        case ".jsx":
        case ".tsx":
        case ".mdx":
        case ".md":
        case ".vue":
        case ".html":
        case ".htm":
          return { entryFile: file, type: fileToLambda(file) };

        // Python Lambda needs to run this additional step once
        case ".py":
          // also run python first run if not run already
          if (!pythonFirstRunCompleted) {
            pythonFirstRun(buildPath).catch(e => console.error(e));
            pythonFirstRunCompleted = true;
          }
          return { entryFile: file, type: fileToLambda(file) };

        // .json can be a proxy path.
        case ".json":
          // check if this is a proxy path
          // avoid reading large json files as they are likely not our proxy path config
          if (fs.statSync(file).size < 10 * 1024) {
            try {
              var json = JSON.parse(fs.readFileSync(file, "utf8"));
              if (json && json.type && json.type === "proxy") {
                return { entryFile: file, type: fileToLambda(file) };
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

  var lambdas = json
    // remove empty elements
    .filter(endpoint => {
      return endpoint !== false;
    })

    // add endpoint path at 0 position for each lambda
    .map(endpoint => {
      var trimmedPath =
        "/" + slash(path.relative(buildPath, endpoint.entryFile));
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

      endpoint["path"] = trimmedPath;
      endpoint["id"] = getLambdaID(trimmedPath);
      return endpoint;
    });

  // get all related files (imports/requires) of this lambda
  lambdas = lambdas.map(endpoint => {
    endpoint["relatedFiles"] = [endpoint.entryFile].concat(
      dependencyTree(endpoint[2], endpoint[1])
    );
    return endpoint;
  });

  // generate a (file -> lambda) index ie. all the lambdas that use that file.
  // this is useful when a file is changed and we need to rebuild all the
  // lambdas depending on that file.
  var fileToLambdas = {};
  lambdas.forEach(endpoint => {
    endpoint.relatedFiles.forEach(file => {
      fileToLambdas[file] = fileToLambdas[file] || [];
      fileToLambdas[file].push(endpoint.entryFile);
    });
  });

  return { lambdas, fileToLambdas };
}

// get all relative files imported by this entryFile
function dependencyTree(type, entryFile) {
  const buildersType = builders[type];

  if (buildersType && buildersType.getRelatedFiles) {
    return buildersType.getRelatedFiles(entryFile);
  } else {
    return []; //no tree walker found for this lambda type
  }
}

module.exports = buildManifest;
