// const underscore = require("underscore")
module.exports = (req, res)=>{
  console.log("req", req.cookies, req.user)
  //console.log(res.location("/abc").get('Location'))
  
  //return res.json(req.user)
  if (req.user) res.json(req.user)
  else res.sendStatus(403)
}