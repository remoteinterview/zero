const underscore = require("underscore")
module.exports = (req, res)=>{
	// foo()
	if (!req.user){
		req.login({id: "asad"}, function(err) {
			// if (err) { return next(err); }
			//res.json(req.user)
			if (err) console.log(err)
			return res.redirect("/user")
			//return res.redirect('/users/' + req.user.username);
		});
	}
	else{
		res.json(req.user)
		//res.redirect("/user")
	}
	
	// res.end("login api here\n"+req.url )
	//console.log(fetch)
}