// module.exports = {
//   handler: require("./handler")
// }
const jsprocess = require("zero-process");
const handler = require("./handler");

module.exports = (pageData, buildInfo) => {
  return jsprocess(handler, pageData, buildInfo);
};
