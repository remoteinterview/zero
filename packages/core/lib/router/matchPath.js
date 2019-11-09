const url = require("url");
//const fetch = require('node-fetch')
const PATH = require("path");
const fs = require("fs");
const debug = require("debug")("core");
const nodeignore = require("../utils/zeroignore");
const stripTrailingSlash = str => {
  return str.replace(/^(.+?)\/*?$/, "$1");
};

function matchPathWithDictionary(
  Manifest,
  forbiddenStaticFiles,
  buildPath,
  path
) {
  const zeroignore = nodeignore();

  path = url.parse(path).pathname;
  path = stripTrailingSlash(path).toLowerCase();
  var staticFile = path.split("/").find(dirname => dirname.endsWith(".static"));
  if (staticFile) return false;

  var match = Manifest.lambdas.find(endpoint => {
    debug("matching", path, endpoint.path);

    // check for exact match
    return endpoint.path === path || endpoint.path === path + "/index";
  });

  // didn't match any lambda.
  if (!match) {
    // check if it's a static file and it's not in the forbidden/ignored files
    var staticPath = PATH.join(buildPath, path);
    var hiddenSourceFile = false;

    // zero-builds folder is actually '.zero/zero-builds' but it should be
    // mounted on "/zero-builds/..." uri instead.
    if (
      path.startsWith("/.zero/zero-builds") &&
      // dont allow access to file/folder starting with _ (which can be server side code bundle)
      path.split("/").filter(p => p.startsWith("_")).length === 0
    ) {
      // staticPath = PATH.join(buildPath, ".zero", path)
    } else {
      hiddenSourceFile = zeroignore.ignores(
        PATH.relative(buildPath, staticPath) || "index"
      );
    }

    if (
      !hiddenSourceFile &&
      !staticFile &&
      fs.existsSync(staticPath) &&
      fs.statSync(staticPath).isFile() &&
      forbiddenStaticFiles.indexOf(staticPath) === -1
    ) {
      return false; // it is a valid public static file
    }

    // check for partial match now ie. query is: /login/username and endpoint will be /login
    // reverse sort to have closest/deepest match at [0] ie. [ "/login/abc/def", "/login/abc", "/login" ]
    var matches = [];
    Manifest.lambdas.forEach(endpoint => {
      const matchedParams = matchPath(endpoint.path, path);
      if (matchedParams) matches.push(endpoint);
    });
    if (matches.length > 0) {
      return getPreferredPath(matches, path);
    }
  } else {
    return match;
  }

  // see if a /404 path exists on manifest
  var forOFor;
  Manifest.lambdas.forEach(endpoint => {
    if (endpoint.path === "/404") {
      var newEndpoint = { ...endpoint, path };
      forOFor = newEndpoint;
    }
  });
  return forOFor || "404"; // not found
}

function matchPath(patternPath, givenPath) {
  patternPath = patternPath.split("/").filter(a => !!a); // remove empty element
  givenPath = givenPath.split("/").filter(a => !!a);

  var matches = true;
  var params = {};
  if (givenPath.length !== patternPath.length) matches = false;
  else {
    givenPath.forEach((p, i) => {
      if (p === patternPath[i]) return;
      if (!patternPath[i]) return (matches = false);
      if (patternPath[i].startsWith("$") && patternPath[i].length > 1) {
        params[patternPath[i].slice(1)] = p;
        return;
      }
      matches = false;
    });
  }

  // if path matches, return params (if any)
  if (matches) debug("matched", givenPath, patternPath, params);
  if (matches) return params;
}

// when two paths match the given path, choose the one without param variable
function getPreferredPath(matches, givenPath) {
  givenPath = givenPath.split("/").filter(a => !!a);
  var chosen = matches[0];

  if (matches.length > 1) {
    matches.forEach(endpointData => {
      const patternPath = endpointData.path.split("/").filter(a => !!a);
      if (patternPath && !patternPath[patternPath.length - 1].startsWith("$")) {
        chosen = endpointData;
      }
    });
  }
  return chosen;
}

module.exports = matchPathWithDictionary;
