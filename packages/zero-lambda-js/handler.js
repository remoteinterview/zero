module.exports = (request, response, endpointData)=>{
  return require(endpointData[1])(request, response)
}