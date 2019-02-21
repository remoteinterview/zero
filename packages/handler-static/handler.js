const path = require('path')
module.exports = (request, response) => {
  response.sendFile(path.join(process.env.BUILDPATH, request.url));
}