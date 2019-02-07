var passport = require("./_passport")


module.exports = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
})
