const path = require('path')
const url = require('url')
module.exports = (request, response) => {

  response.sendFile(path.join(process.env.BUILDPATH, url.parse(request.url).pathname));
}