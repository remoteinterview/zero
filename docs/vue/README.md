# Vue (WIP)

Zero can bundle and render Vue. Zero treats each `.vue` file in your project folder as a separate page.

If your vue component resides in `./about.vue` file, it's exposed at `http://<SERVER>/about`. Inspired by good ol' PHP days.

## Quick Start

Create a file `index.vue` in an empty folder and add the following code to it:

```jsx
// index.vue
<template>
  <p>{{ greeting }} World!</p>
</template>

<script>
module.exports = {
  data: function () {
    return {
      greeting: 'Hello'
    }
  }
}
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

## Fetch API

[`fetch()`](https://developers.google.com/web/updates/2015/03/introduction-to-fetch) allows you to do network requests both in server-side code (like `getInitialProps`) and on client-side (like `componentDidMount`). `fetch()` works the same on both the server and client.

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
