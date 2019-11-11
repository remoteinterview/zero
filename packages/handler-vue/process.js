const jsprocess = require("zero-process");
const handler = require("./renderer");

module.exports = (endpointData, buildInfo) => {
  return jsprocess(handler, endpointData, buildInfo);
};
