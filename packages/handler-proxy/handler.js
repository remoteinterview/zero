const expressWrap = require("./expressWrap");
const fs = require("fs");

module.exports = async (pageData, buildInfo) => {
  return new Promise((resolve, reject) => {
    var json = JSON.parse(fs.readFileSync(pageData.entryFile, "utf8"));
    resolve(expressWrap(json));
  });
};
