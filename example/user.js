// module.exports = (req, res)=>{
//   // console.log("1", req.baseUrl, "2", req.originalUrl, "3", req.url, "4", req.path)
//   if (req.user) res.json({user: req.user, params: req.params})
//   else res.sendStatus(403)
// }

export default (req, res) => {
  if (req.user) res.json({user: req.user, params: req.params})
  else res.sendStatus(403)
}