module.exports = (req, res)=>{
	if (!req.user){
		req.login({id: "asad"}, function(err) {
			if (err) console.log(err)
			return res.redirect("/api/user")
		})
	}
	else{
		res.redirect("/api/user")
		//res.send(req.user)
	}
}