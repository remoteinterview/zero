//const mkdirp = require('mkdirp')
const path = require("path");
//const bundle = require('./bundle')
const fs = require("fs");
const which = require("which");
const pythonExists = which.sync("python", { nothrow: true });
const python3Exists = which.sync("python3", { nothrow: true });

module.exports = async (req, res, file, bundlePath, basePath, bundleInfo) => {
  const pythonExe = python3Exists || pythonExists;
  if (!pythonExe) throw new Error("No 'python' found in the PATH.");
  res.send("Python handler is coming soon.");
};
