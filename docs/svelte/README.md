# Svelte

Zero can bundle and render Svelte. Zero treats each `.svelte` file in your project folder as a separate page.

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

## Fetching API Data

Loading data from API and then displaying it is a common task in any website. Your svelte pages can optionally have `preload()` function that will load some data that the page depends on. It's only called on server-side. Zero will automatically merge the returned object with component data.

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
