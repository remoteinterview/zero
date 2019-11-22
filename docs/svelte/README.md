# Svelte

Zero can bundle and render Svelte pages. Zero treats each `.svelte` file in your project folder as a separate page. Svelte pages are also server-rendered.

If your svelte component resides in `./about.svelte` file, it's exposed at `http://<SERVER>/about`.

## Quick Start

Create a file `index.svelte` in an empty folder and add the following code to it:

```html
// index.svelte
<script>
  let name = "World";
</script>

<h1>Hello {name}</h1>
```

You can now run `zero` command in this folder and open [`http://localhost:3000/`](http://localhost:3000) in the browser.

For each Svelte page, zero does the following for you:

- Transpilation and bundling (with Parcel).
- Server rendering, so you don't see blank page until JS loads.
- Automatic code splitting

## Props

The top level `.svelte` component/page is passed props with useful information, which your component can consume by declaring them in your `<script>` block:

```html
<script>
  export let user; // user data from session (req.user of Express)
  export let url; // { query, params }
  // also any preload data returned from preload()
</script>
```

## Dynamic Routes (Pretty URL Slugs)

Zero decides routes based on file structure. Most projects also require dynamic routes like `/user/luke` and `/user/anakin`. Where `luke` and `anakin` are parameters. Zero natively supports this type of routes: any file or folder that **starts with \$** is considered a dynamic route.

So if you create `./user/$username.svelte` and then from browser visit `/user/luke`, Zero will send that request to `$username.svelte` file and set `url.params` prop to `{username: 'luke'}`. Code for this:

```js
/*
project/
└── user/
    └── $username.svelte <- this file
*/
<script>
  export let url; // { query, params }
  // also any preload data returned from preload()
</script>

<h1>Hello, {url.params.username}</h1>

```

Parameters apply to folder-names too. Another example: if you want to cater `/user/luke/messages` route, you can handle this with following directory structure:

```
project/
└── user/
    └── $username/
        └── index.svelte
        └── messages.svelte
```

- `index.svelte` handles `/user/:username` routes.
- `messages.svelte` handles `/user/:username/messages` routes.

## Fetching API Data

You can have API routes alongside your Svelte pages (likely in `.js` or `.py` files). You can then _fetch_ those API endpoinds from your Svelte page. To do this, your Svelte page can optionally export a `preload()` function that will load any data that the page depends on, before rendering the page. Zero will first resolve `preload()` and pass the response to Svelte renderer along with other props. This means that the page will be rendered with data on server.

```html
<script context="module">
  export async function preload({ req, url, user }) {
    const res = await fetch(`/api/messages`);
    const messages = await res.json();

    return { messages };
  }
</script>

<script>
  // messages prop returned from preload() is passed here.
  export let messages;
</script>
```

You can export this function from your `context="module"` script.

This method runs on server-end. Data returned from `preload()` is serialized when server rendering. Make sure the returned object is a plain Object and not using Date, Map or Set.

`preload` is passed an object as argument with following values:

- **req** - The standard [Express Request](https://expressjs.com/en/4x/api.html#req) object for this request.
- **user** - When a user is logged in, this object contains the session data you stored when authenticating this user. [Read more](https://github.com/remoteinterview/zero/tree/master/docs/nodejs#sessions).
- **url** - This object contains further two keys:
  - **query**: Query parameters passed to the request. Like if you URL called was `/post?id=1`, `url.query` will be `{id: 1}`.
  - **params**: An object of URL parameters, available when the page is part of a [dynamic route](https://github.com/remoteinterview/zero#dynamic-routes-pretty-url-slugs). Like: `/post/19/details` (handled by file `./post/$postId/details.svelte`), `url.params` in this case will be object `{postId: 19}`.

## Fetch API

[`fetch()`](https://developers.google.com/web/updates/2015/03/introduction-to-fetch) allows you to do network requests both in server-side code (like `preload()`) and on client-side. `fetch()` works the same on both the server and client.

Should you want to make a `fetch` request with credentials such as cookies, you should set the `credentials` of the request to `"include"`.

```js
fetch(url, {
  credentials: "include"
});
```

## Populating `<head>`

You should set the page's head tags (`<title>`, `<meta>`, etc.) for improved SEO. Svelte has [<svelte:head>](https://svelte.dev/docs#svelte_head) set up for you to use in your Svelte pages like below:

```html
<svelte:head>
  <title>Page Title</title>
</svelte:head>

<h1>Hello!</h1>
```

Notice the `<svelte:head>` tag. Zero will inject any meta tags here to the page's HTML.
