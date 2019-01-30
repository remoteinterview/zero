module.exports = async (req, res)=>{
  var resp = await fetch("/obj.json")
  var json = await resp.json()
  res.json({
    evens: json.evens
  })
}