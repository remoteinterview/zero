module.exports = async (req, res)=>{
  var resp = await fetch("user", {
    credentials: 'include'
  })
  var json = await resp.json()
  res.json(json)
}