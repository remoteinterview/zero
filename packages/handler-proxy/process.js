const handler = require("./handler");

module.exports = (endpointData, buildInfo) => {
  return handler(endpointData, buildInfo, true);
};
