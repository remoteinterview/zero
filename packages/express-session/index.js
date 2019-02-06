const session = require('express-session')
const sessionStore = require("./sessionStore")(session)
const SESSION_TTL = parseInt(process.env.SESSION_TTL)
var passport = require('passport');
passport.serializeUser(function (user, done) {
  done(null, JSON.stringify(user));
})

passport.deserializeUser(function (id, done) {
  done(null, JSON.parse(id))
})



module.exports = (app) => {
  app.use(require('cookie-parser')());
  
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    cookie: { maxAge : SESSION_TTL },
    saveUninitialized: false 
  }))

  // Initialize Passport and restore authentication state, if any, from the
  // session.
  app.use(passport.initialize());
  app.use(passport.session());
}