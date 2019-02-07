# Login with Google in Node.js

Zero already implements `express` and `passport` and sessions. This example uses [passport-google-oauth](https://github.com/jaredhanson/passport-google-oauth) module.

## Configuration

The **Client Id** and **Client Secret** needed to authenticate with Google can be set up from the [Google Developers Console](https://console.developers.google.com/). You may also need to enable Google+ API in the developer console, otherwise user profile data may not be fetched. Google supports authentication with both oAuth 1.0 and oAuth 2.0.

Once you have both those values, you need to edit `_passport.js` with those values. You will also need to edit callback URL to wherever `callback.js` is hosted. 

This URL also needs to be added to ` Authorized redirect URIs` in your Google Console (edit the Client ID you just created and add the callback URL).

If you copy these snippets to your project. Be sure to change URLs in each file.


## Where are my sessions stored?
By default, they are stored in `tmp` folder of your machine. This is fine when developing locally, but you probably need to read docs on [Sessions](https://github.com/remoteinterview/zero/tree/master/docs/nodejs#sessions) before you deploy your app.