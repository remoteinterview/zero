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

So if you visit `/user/luke` and there is no `./user/luke.js` but there is `./user.js`. Zero will send the request to `/user` and set `req.params` to `['luke']`

Another example: if you visit `/user/luke/messages`. Zero will forward this to `./user.js` and set `req.params` to `['luke', 'messages']`