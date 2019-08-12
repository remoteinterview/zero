module.exports = (req, res)=>{
  res.send({dirname: __dirname, filename: __filename})
}