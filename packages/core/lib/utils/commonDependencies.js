// given a source file, send back dependencies that will
// be installed in user's package.json
const path = require("path");

module.exports = file => {
  var deps = {
    "@babel/core": "^7.2.2",
    "@babel/runtime": "^7.3.1",
    "regenerator-runtime": "^0.12.0",
    "@babel/plugin-proposal-class-properties": "^7.3.4",
    "babel-plugin-transform-zero-dirname-filename": "^1.1.1-alpha.0",
    "@babel/plugin-transform-runtime": "^7.2.0"
  };

  const ext = path.extname(file);
  if (ext === ".sass") {
    var sassDeps = { sass: "^1.17.2" };
    deps = { ...deps, sassDeps };
  }

  return deps;
};
