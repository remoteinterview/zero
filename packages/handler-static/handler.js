const staticHandler = require('serve-handler');

module.exports = (request, response) => {
  return staticHandler(request, response, {
    public: process.env.BUILDPATH
  });
}