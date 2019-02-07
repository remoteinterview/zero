var passport = require("./_passport")

module.exports = passport.authenticate('google', { 
  successRedirect: "/google-login-nodejs",
  failureRedirect: '/google-login-nodejs'
})
