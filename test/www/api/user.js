module.exports = (req, res)=>{
  if (req.user) res.json(req.user)
  else res.json({err: "forbidden"})
}