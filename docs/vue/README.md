# Vue

Zero can bundle and render Vue. Zero treats each `.vue` file in your project folder as a separate page.

If your vue component resides in `./about.vue` file, it's exposed at `http://<SERVER>/about`. Inspired by good ol' PHP days.

## Quick Start

Create a file `index.vue` in an empty folder and add the following code to it:

```html
// index.vue
<template>
  <p>{{ greeting }} World!</p>
</template>

<script>
  module.exports = {
    data: function() {
      return {
        greeting: "Hello"
      };
    }
  };
</script>

<style scoped>
  p {
    font-size: 2em;
    text-align: center;
  }
</style>
```

The above code exports a [single-file component](https://vuejs.org/v2/guide/single-file-components.html).

You can now run `zero` command in this folder and open [`http://localhost:3000/`](http://localhost:3000) in the browser.

For each Vue page, zero does the following for you:

- Transpilation and bundling (with Parcel).
- Bundle CSS/SASS/SCSS.
- Server rendering, so you don't see blank page until JS loads.
- Automatic code splitting

## Fetching API Data

Loading data from API and then displaying it is a common task in any website. `asyncData` is called every time before the **page** is loaded. It's only called on server-side. Zero will automatically merge the returned object with component data.

**Note:** You do not have access of the component instance through `this` inside `asyncData` because it is called before initiating the component.

Consider the example below which fetches user's messages and display the count:

```html
<template>
  <div>
    You have {{ messagesCount }} messages.
  </div>
</template>

<script>
  module.exports = {
    data: function() {
      return {
        value: "Title"
      };
    },
    asyncData: async function({ req, url, user }) {
      var messages = await fetch("/api/messages").then(resp => resp.json());
      return { messagesCount: messages.length };
    }
  };
</script>
```

Notice that to load data, we use `asyncData` which is an async static method. It can asynchronously fetch anything that resolves to a JavaScript plain Object. `asyncData` is inspired by Nuxt.js.

This method runs on server end. Data returned from `asyncData` is serialized when server rendering. Make sure the returned object from asyncData is a plain Object and not using Date, Map or Set.

`asyncData` is passed an object as argument with following values:

- **req** - The standard [Express Request](https://expressjs.com/en/4x/api.html#req) object for this request.
- **user** - When a user is logged in, this object contains the session data you stored when authenticating this user. [Read more](https://github.com/remoteinterview/zero/tree/master/docs/nodejs#sessions).
- **url** - This object contains further two keys:
  - **query**: Query parameters passed to the request. Like if you URL called was `/post?id=1`, `url.query` will be `{id: 1}`.
  - **params**: An array of URL parameters, available when the page was called with some additional child path. Like: `/post/1/details`, `url.params` will be `['1', 'details']`.

## Fetch API

[`fetch()`](https://developers.google.com/web/updates/2015/03/introduction-to-fetch) allows you to do network requests both in server-side code (like `asyncData`) and on client-side. `fetch()` works the same on both the server and client.

Should you want to make a `fetch` request with credentials such as cookies, you should set the `credentials` of the request to `"include"`.

```js
fetch(url, {
  credentials: "include"
});
```

## Populating `<head>`

You should set the page's head tags (`<title>`, `<meta>`, etc.) for improved SEO. Zero has [Vue Meta](https://github.com/nuxt/vue-meta) set up for you to use in your Vue components like below:

```jsx
<template>
  <div>
    {{ value }}
  </div>
</template>

<script>
module.exports = {
  data: function () {
    return {
      value: 'Title'
    }
  },
  head: function (){
    return {
      title: "My Title",
      meta: [
        // hid is used as unique identifier. Do not use `vmid` for it as it will not work
        { hid: 'description', name: 'description', content: 'description' }
      ]
    }
  }
}
</script>

```

Notice the `head()` option. Zero will inject any meta tags here to the page's HTML.

You can check all the supported tags [here](https://github.com/nuxt/vue-meta#recognized-metainfo-properties).
