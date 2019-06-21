module.exports = (req, res)=>{
  res.send({rootParam: req.params.rootParam})
}