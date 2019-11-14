const jsprocess = require("zero-process");
const handler = require("./handler");

module.exports = (endpointData, buildInfo) => {
  return jsprocess(handler, endpointData, buildInfo);
};
