const path = require('path')
module.exports = (request, response, file) => {
  response.sendFile(path.join(process.env.BUILDPATH, file));
}