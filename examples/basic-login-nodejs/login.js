// This would ideally come from database.
// Don't forget to hash your passwords.
const PASSWORDS = {luke: "abcd"} 

module.exports = (req, res)=>{
  console.log(req.body)
  const {username, password} = req.body
  if (password && PASSWORDS[username] === password){
    req.login({id: "asad"}, function(err) {
      if (err) res.sendStatus(403)
      else res.redirect("user")
    })
  }
  else{
    res.sendStatus(403)
  }
}