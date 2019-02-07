# Login in Node.js

This is a basic login example in Node.js. It works like this:
- The HTML form submits username:password to login.js
- The login.js checks if the password is correct and it then calls `req.login()`.
- It then redirects to user.js which retrieves session info of the current user and presents it.

Read more about [Sessions](https://github.com/remoteinterview/zero/tree/master/docs/nodejs#sessions) here.