module.exports = (req, res, file)=>{
  const handler = require(file)
  handler(req, res)
}
