const path = require('path')
const url = require('url')
module.exports = (request, response) => {
  var file = path.join(process.env.BUILDPATH, url.parse(request.url).pathname)

  // prevent sending files outside project folder.
  if (!require('path').relative(process.env.BUILDPATH, file).startsWith("..") ){
    response.sendFile(file);
  }
  else{
    response.sendStatus(404)
  }
}