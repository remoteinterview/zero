# Proxy Routes

Zero allows you to proxy certain routes to a completely different server of your choice. These are useful for a variety of reasons:

- Gradual transition to Zero by proxying everything but the newer pages.
- Seperating the code for landing pages and app pages but making them seamless to end-user.

## Getting Started

A proxy path can be defined by just creating a JSON file with the `url` key with the URL of the server to proxy that route to.

### Example

Suppose, we want to proxy `/app` route to `http://myapp.com`. We just need to create a file `./app.json` with the following content:

```json
{
  "type": "proxy",
  "url": "http://myapp.com"
}
```

Note that zero will only forward `/app` requests to this server but not `/app/anotherPage` or `/app/list`. To do that, you need to add the same JSON file at the corresponding path, like: `./app/list.json`.

### Dynamic Route Example

The above examples do not cater dynamic route (like `/app/messages/1`). You can use Zero's dynamic paths feature for proxy routes too. Just create the same JSON file in `/app/messages/$id.json`.

## Pinned Path Mode

When you define a sub-route in your JSON (like: `http://myapp.com/somePage`). Zero will proxy all requests to that page regardless of what the originally visited route is.

### Example

Let's say you add the following JSON to `./page/$id.json`:

```json
{
  "type": "proxy",
  "url": "http://myapp.com/about"
}
```

When you visit `/page/1` or `/page/2`, they will all return the same `http://myapp.com/about` page ignoring the original route.
