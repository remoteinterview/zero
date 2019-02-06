module.exports = (req, res)=>{
  res.json({body: req.body || false})
}