module.exports = (req, res)=>{
  res.send({param: req.params.param, nestedParam: req.params.nestedParam})
}