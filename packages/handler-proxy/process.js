const handler = require("./handler");

module.exports = (pageData, buildInfo) => {
  return handler(pageData, buildInfo, true);
};
