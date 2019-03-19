var GOOGLE_ID="YOURGOOGLEID.apps.googleusercontent.com",
GOOGLE_SECRET="Rj2_vDGoogleSecretgXxB4e"
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    passport = require("passport")

// Use the GoogleStrategy within Passport.
//   Strategies in passport require a `validate` function, which accept
//   credentials (in this case, an OpenID identifier and profile), and invoke a
//   callback with a user object.
passport.use(new GoogleStrategy({
  clientID: GOOGLE_ID,
  clientSecret: GOOGLE_SECRET,
  callbackURL: "http://localhost:3000/google-login-nodejs/callback"
}, function (accessToken, refreshToken, profile, done) {
  return done(null, {
    name: profile.displayName,
    email: profile.emails[0].value
  })
})
)

module.exports = passport