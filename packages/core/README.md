<p align="center">
  <img src="https://raw.githubusercontent.com/remoteinterview/zero/master/docs/images/logo.png" width="50">
  <h1 align="center">Zero Server</h1>
  <p align="center">Zero configuration web framework.</p>
</p>

<p align="center">
  <a href="#features">Features</a> |
  <a href="#installation">Installation</a> |
  <a href="#getting-started">Getting Started</a> |
  <a href="examples/">Examples</a> |
  <a href="https://zeroserver.io/docs">Docs</a>
</p>

<p align="center">
  <a href="https://discord.gg/n7y5nRs">
    <img alt="Join the community on Discord" width="120" src="https://raw.githubusercontent.com/remoteinterview/zero/master/docs/images/discord.png" />
  </a>
</p>

---

**Zero** is a web framework to simplify modern web development. It allows you to build your application without worrying about package management or routing. It's as simple as writing your code in a mix of [Node.js](docs/nodejs/README.md), [HTML](docs/html/README.md), [MDX](docs/mdx/README.md), [Vue](docs/vue/README.md), [Svelte](docs/svelte/README.md), [Python](docs/python/README.md), and [static files](docs/static/README.md) and putting them all in a folder. Zero will serve them all. Zero abstracts the usual project configuration for routing, bundling, and transpiling to make it easier to get started.

_An example project with different types of pages, all in one folder:_

![A basic mono-repo](https://raw.githubusercontent.com/remoteinterview/zero/master/docs/images/header.gif "A basic mono-repo")

## Features

**Auto Configuration**: Your project folder doesn't require config files. You just place your code and it's automatically compiled, bundled and served.

**File-system Based Routing**: If your code resides in `./api/login.js` it's exposed at `http://<SERVER>/api/login`. Inspired by good ol' PHP days.

**Auto Dependency Resolution**: If a file does `require('underscore')`, it is automatically installed and resolved. You can always create your own `package.json` file to install a specific version of a package.

**Multiple Languages**: Zero is designed to support code written in many languages all under a single project. Imagine this:

1. Exposing your Tensorflow model as a python API.
2. Using React pages to consume it.
3. Writing the user login code in Node.js.
4. Your landing pages in a mix of HTML or Markdown/MDX.

All under a single project folder as a single web application.

## Play on Glitch

You can play with Zero without installing it locally. Click the button below:

<!-- Remix Button -->
<a href="https://glitch.com/edit/#!/remix/zero-starter">
  <img src="https://cdn.glitch.com/2bdfb3f8-05ef-4035-a06e-2043962a3a13%2Fremix%402x.png?1513093958726" alt="remix this" height="30">
</a>

## Installation

You can install `zero` globally by:

```sh
npm install -g zero
```

## Getting Started

Let's start by making a website that tells us server time.

First we need to create an API endpoint in Node.js to tell us time in JSON.

Create a new folder and add a new file `time.js` in that folder. In this file, export a function that accepts `Request` and `Response` objects ([like Express](https://expressjs.com/en/4x/api.html#res)):

```js
// time.js
const moment = require("moment");

module.exports = (req, res) => {
  var time = moment().format("LT"); // 11:51 AM
  res.send({ time: time });
};
```

Once saved, you can `cd` into that folder and start the server like this:

```sh
zero
```

Running this command will automatically install any dependencies (like _momentjs_ here) and start the web server.

Open this URL in the browser: [`http://localhost:3000/time`](http://localhost:3000/time)

You just created an API endpoint 🎉:

![Time API](docs/images/timeapi.png?raw=true "Time API")

Keep the server running. Now let's consume our API from a React page, create a new file `index.jsx` and add the following code:

```jsx
// index.jsx
import React from "react";

export default class extends React.Component {
  static async getInitialProps() {
    var json = await fetch("/time").then(resp => resp.json());
    return { time: json.time };
  }

  render() {
    return <p>Current time is: {this.props.time}</p>;
  }
}
```

This is a standard React component. With one additional hook for initial data population:

`getInitialProps` is an `async` static method which is called by `zero` when the page loads. This method can return a plain object which populates `props`.

Now go to this URL: `http://localhost:3000/` and you should see the current server time rendered by React while `fetch`-ing an API endpoint you created earlier:

![Time In React](docs/images/timejsx.png?raw=true "Time In React")

`zero` automatically bundles your code and supports server-side rendering. You don't need to fiddle with webpack anymore.

That's it! You just created a web application.

## Supported Languages

- [Node.js](docs/nodejs/README.md) _(JavaScript & TypeScript)_
- [React](docs/react/README.md) _(JavaScript & TypeScript)_
- [HTML](docs/html/README.md)
- [Markdown / MDX](docs/mdx/README.md)
- [Vue](docs/vue/README.md)
- [Svelte](docs/svelte/README.md)
- [Python](docs/python/README.md)

## Auto Dependency Resolution

If a file does `require('underscore')`, the latest version of that package is automatically installed from NPM and resolved.

But sometimes you want to use a specific version or a dependency from a private repository. You can do that by creating a `package.json` in your project folder and adding dependencies to it. Zero will install those versions instead.

Example (package.json):

```json
{
  "name": "myapp",
  "dependencies": {
    "underscore": "^1.4.0",
    "private_ui_pkg": "git+https://github.com/user/repo.git"
  }
}
```

## Contributing

Please see our [CONTRIBUTING.md](CONTRIBUTING.md)

## License

Zero is [Apache-2.0 licensed](LICENSE.md).
