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
  <a href="#running-on-cloud">Running on Cloud</a> |
  <a href="docs/">Docs</a>
</p>

<p align="center">
  <a href="https://discord.gg/n7y5nRs">
    <img alt="Join the community on Discord" width="120" src="https://raw.githubusercontent.com/remoteinterview/zero/master/docs/images/discord.png" />
  </a>
</p>

---

**Zero** is a web framework to simplify modern web development. It allows you to build your application without worrying about package management or routing. It's as simple as writing your code in a mix of [Node.js](docs/nodejs/README.md), [React](docs/react/README.md), [HTML](docs/html/README.md), [MDX](docs/mdx/README.md), [Vue](docs/vue/README.md), [Svelte](docs/svelte/README.md), [Python](docs/python/README.md), and [static files](docs/static/README.md) and putting them all in a folder. Zero will serve them all. Zero abstracts the usual project configuration for routing, bundling, and transpiling to make it easier to get started.

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

## Routing

### File-system Based Routing

Zero serves routes based on file structure. If you write a function that resides in `./api/login.js` it's exposed at `http://<SERVER>/api/login`. Similarly if you put a React page under `./about.jsx` it will be served at `http://<SERVER>/about`

### 404 Page

Create a `./404.js` file (or a `.jsx`, `.vue`, .`py`, etc) to catch all requests to pages that don't exist.

### Dynamic Routes (Pretty URL Slugs)

Zero decides routes based on file structure. Most projects also require dynamic routes like `/user/luke` and `/user/anakin`. Where `luke` and `anakin` are parameters. Zero natively supports this type of routes: any file or folder that **starts with \$** is considered a dynamic route.

So if you create `./user/$username.js` and then from browser visit `/user/luke`, Zero will send that request to `$username.js` file and set `req.params` to `{username: 'luke'}`. Code for this:

```js
/*
project/
└── user/
    └── $username.js <- this file
*/
module.exports = function(req, res) {
  console.log(req.params); // = {username: 'luke'} when user visits /user/luke
  res.send({ params: req.params });
};
```

Parameters apply to folder-names too. Another example: if you want to cater `/user/luke/messages` route, you can handle this with following directory structure:

```
project/
└── user/
    └── $username/
        └── index.js
        └── messages.js
```

- `index.js` handles `/user/:username` routes.
- `messages.js` handles `/user/:username/messages` routes.

**Tip:** `$` is used by Bash for variables. So it might be confusing when you do `cd $username` or `mkdir $username` and nothing happens. The right way to do this is escaping the `$` ie. `cd \$username` or `mkdir \$username`.

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

## .zeroignore file

By default, Zero compiles and serves all files in your project. But most of the time, you don't want to expose a certain file or folder. You can add `.zeroignore` file to prevent Zero from serving that file as a valid route.

### Example

In a project with following structure:

```
- project/
-- components/
-- api/
-- index.jsx
```

You probably don't want to expose `components` directory. To do this, you can create `.zeroignore` file with the following text:

```
components
```

This will prevent your users from accessing `/components` path directly.

## Running on Cloud

A Zero app is a regular Node.js server. But zero doesn't create `package.json` in your project folder. For most clouds (Heroku, EC2, etc) you probably need `package.json`. You can create one similar to this:

```json
{
  "name": "my-zero-app",
  "scripts": {
    "dev": "zero",
    "build": "zero build",
    "start": "NODE_ENV=production zero"
  },
  "dependencies": {
    "zero": "latest"
  }
}
```

- We add dependency `zero`, so the cloud builder can install `zero` on your server.
- Add a `"start"` command and also set `NODE_ENV` to `production` so zero generates minified builds and disabled HMR etc.
- Add a `"build"` command to pre-build all files to speed up cold boots. Don't forget to run `npm run build` in your build step (in your Dockerfile, `heroku-postbuild`, etc)
- If your cloud has an option to set environment variables / config variables (to store secrets, API keys, etc), these variables are automatically passed to your code and can be accessed as you normally would. In node, using `process.env.MY_SECRET`. You should never commit your local `.env` file to your code.

After this, you can follow the instructions from your cloud provider for deploying a Node.js app.

### Heroku Buildpack

We provide an official [Buildpack for Heroku](https://github.com/remoteinterview/zero-heroku-buildpack). If you are deploying on Heroku, this is the easiest way.

### Changing Server's Port

By default zero runs on port `3000`. You can change this by setting the `PORT` environment variable, like this: `PORT=8080 zero`

### Running with Docker

Here is a basic `Dockerfile` you can add to your zero application to Docker-ize it:

```dockerfile
FROM node:alpine


# Install dependencies via apk
RUN apk update && apk upgrade \
    && apk add --no-cache python python3 g++ make \
    && rm -rf /var/cache/apk/*

# Install zero globally
RUN npm install --quiet --no-progress --unsafe-perm -g zero

# Add current folder to /app
ADD . /app

# Run zero in production mode
ENV NODE_ENV production

# Generate bundles
RUN zero build

# Expose port
ENV PORT 80
EXPOSE 80

WORKDIR /app

CMD ["zero"]
```

## Contributing

Please see our [CONTRIBUTING.md](CONTRIBUTING.md)

## License

Zero is [Apache-2.0 licensed](LICENSE.md).
