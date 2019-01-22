module.exports = (req, res)=>{
  if (req.user) res.json(req.user)
  else res.sendStatus(403)
}