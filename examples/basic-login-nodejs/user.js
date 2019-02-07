export default (req, res) => {
  if (req.user) res.send(`Hello ${req.user.id}!`)
  else res.sendStatus(403)
}