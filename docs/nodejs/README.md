# Node.js / JavaScript

Zero allows you to define your API endpoints as individual functions. Each such function resides in it's own file.

If your function resides in `./api/login.js` file, it's exposed at `http://<SERVER>/api/login`. Inspired by good ol' PHP days.


### Example
```js
// hello.js
module.exports = function(req, res) {
  res.send("Hello");
}
```

The above file exports a function. This function accepts [Request](https://expressjs.com/en/4x/api.html#req) and [Response](https://expressjs.com/en/4x/api.html#res) objects. Zero uses [Express.js](https://expressjs.com/) under the hood, so these objects are same as Express.

This means `res.send()`, `res.json()` will work just fine.



## Query Parameters

When the user passes query parameters to your function like this: `/post?id=1`. You can access them from Request object like this: `req.query['id']`. 

## POST, PUT, PATCH, DELETE Methods

Your exported function is called all for HTTP methods. Consider the following code:

```js
// submit.js
module.exports = function(req, res) {
  console.log(req.body)
  res.send({body: req.body})
}
```

If you send POST request to `/submit` with `json` or `urlencoded` body. It will be parsed and populated in `req.body`.

## Route Rewrites
Zero decides routes based on file structure. But sometimes you would want to change `/user?id=luke` to `/user/luke`. To cater this type of routes, **all requests sent to a route that doesn't exist are passed on to the closest parent function**. 

So if you visit `/user/luke` and there is no `./user/luke.js` but there is `./user.js`. Zero will send the request to `/user` and set `req.params` to `['luke']`. Code for this:

```js
// user.js
module.exports = function(req, res) {
  console.log(req.params) // ['luke'] when user visits /user/luke
  res.send({params: req.params})
}
```

Another example: if you visit `/user/luke/messages`. Zero will also forward this to `./user.js` and set `req.params` to `['luke', 'messages']`

## Fetch API
[`fetch()`](https://developers.google.com/web/updates/2015/03/introduction-to-fetch) allows you to do network requests from your API code.

`fetch` is a `zero`-specific feature for Node.js. It works similar to how it works in browser. Relative URLs (like `/api/messages`) also work.

If you want to `fetch` data from a login-protected path, you should set the `credentials` of the request to `"include"`.

```js
fetch(url, {
  credentials: 'include'
})

```

### Example

If you have a messages API that only works if the user is logged in, like this:

```js
// api/messages.js
// sends user's messages from database.
module.exports = (req, res) => {
  if (req.user){
    var msgs = DB.find({user: req.user.id })
    res.json(msgs)
  }
  else{
    res.sendStatus(403)
  }
}
```

And you want to fetch these messages from another API endpoint, like this:
```js
// api/user.js
module.exports = (req, res) => {
  var messages = await fetch("/api/messages", {
    credentials: 'include'
  })
    .then((resp) => resp.json())
  // ... fetch other info
  res.send({
    profile: profile,
    messages: messages
  })
  
}
```

Zero automatically forwards credentials even for nested `fetch()` requests.

## TypeScript
Zero supports writing API endpoints in TypeScript. Any file with `.ts` extension will be parsed as TypeScript. Here is an example handler:

```ts
// hello.ts
import * as express from "express";

function handler(req: express.Request, res: express.Response) {
  res.send("Hello TypeScript")
}
export default handler
```

## Sessions
Zero manages sessions on your behalf. You just need to specify where the session data should be stored. Currently Zero supports Redis and MongoDB backends. 

By default the session data is stored in system `tmp` directory. This is fine when developing locally. But not when you want to deploy.

### Using Redis for Sessions
Zero reads credentials from environment variables. Zero also loads variables from `.env` file in your project root, if it's present.

You can provide a **Connection String / URL** to your store by setting `SESSION_REDIS_URL` environment variable. 

Alternatively, you can provide connection credentials using
 `SESSION_REDIS_HOST`, `SESSION_REDIS_PASSWORD`, `SESSION_REDIS_PORT` environment variables.


### Using MongoDB for Sessions
Zero reads credentials from environment variables. Zero also loads variables from `.env` file in your project root, if present.

To use MongoDB as your session store, you need to provide MongoDB's [connection string](https://docs.mongodb.com/manual/reference/connection-string/) in `SESSION_MONGODB_URL` environment variable.

### Session TTL
You can specify when the session should expire by setting `SESSION_TTL` in seconds. By default this TTL is set to 1 year from login.

### Basic Login Example

Here is a very simple example of how to create a basic login system.

First, let's create a basic HTML form:
```html
<html>

<body>
    <form action="/login" method="POST">
        <label for="username"><b>Username</b></label>
        <input name="username" type="text" placeholder="Enter Username" required />
        <br />
        <label for="password"><b>Password</b></label>
        <input name="password" type="password" placeholder="Enter Password" required />
        <br />
        <button type="submit">Login</button>
    </form>
</body>

</html>
```
The form takes `username` and `password` and sends `POST` to `/login` API.

Let's create that login API in file `./login.js`. Add the following code:

```js
// login.js

// This would ideally come from database.
// Don't forget to hash your passwords.
const PASSWORDS = {luke: "abcd"} 

module.exports = (req, res)=>{
  const {username, password} = req.body
  if (password && PASSWORDS[username] === password){
    req.login({id: username}, function(err) {
      if (err) res.sendStatus(403)
      else res.redirect("/user")
    })
  }
  else{
    res.sendStatus(403)
  }
}
```

- This checks `req.body` for user-submitted username and password. 
- Then it checks if the password matches with the saved password.
- It calls `req.login()` with any data it wants to save in session for this user. You can store name, email, etc here. This object is automatically populated in `req.user` on all future requests by this user. This way you can display user-specific data based on `req.user`.

Example:

```js
// user.js
module.exports = (req, res) => {
  if (req.user) res.send(`Hello ${req.user.id}`)
  else res.sendStatus(403)
}
```

This `user` object is also passed to your React pages as props:

```jsx
export default (props) =>(
  <h1>Hello {props.user?props.user.id:"World"}</h1>
)
```