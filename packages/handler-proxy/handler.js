const expressWrap = require("./expressWrap");
const fs = require("fs");

module.exports = async (endpointData, buildInfo) => {
  return new Promise((resolve, reject) => {
    var json = JSON.parse(fs.readFileSync(endpointData.entryFile, "utf8"));
    resolve(expressWrap(json));
  });
};
