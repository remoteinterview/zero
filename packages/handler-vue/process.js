const jsprocess = require("zero-process");
const handler = require("./renderer");

module.exports = (pageData, buildInfo) => {
  return jsprocess(handler, pageData, buildInfo);
};
