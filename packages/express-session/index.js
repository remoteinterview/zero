const session = require("express-session");
const cookieSession = require("cookie-session");

const sessionStore = require("./sessionStore")(session);
const SESSION_TTL = parseInt(process.env.SESSION_TTL);
var passport = require("passport");
passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user));
});

passport.deserializeUser(function(id, done) {
  done(null, JSON.parse(id));
});

module.exports = app => {
  app.use(require("cookie-parser")());

  if (sessionStore) {
    app.use(
      session({
        store: sessionStore,
        secret: process.env.SESSION_SECRET,
        resave: false,
        cookie: { maxAge: SESSION_TTL },
        saveUninitialized: false
      })
    );
  } else {
    app.use(
      cookieSession({
        name: "session",
        secret: process.env.SESSION_SECRET,
        maxAge: SESSION_TTL
      })
    );
  }
  // Initialize Passport and restore authentication state, if any, from the
  // session.
  app.use(passport.initialize());
  app.use(passport.session());
};
