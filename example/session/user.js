
export default (req, res) => {
  if (req.user) res.json({user: req.user, params: req.params})
  else res.sendStatus(403)
}