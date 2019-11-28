# Overview

**Zero** is a web framework to simplify modern web development. It allows you to build your application without worrying about package management or routing. It's as simple as writing your code in a mix of \*\*Node.js, React, HTML, MDX, Vue, Svelte, Python and putting them all in a folder. Zero will serve them all. Zero abstracts the usual project configuration for routing, bundling, and transpiling to make it easier to get started.

## Try Online

You can try Zero without installing it locally, thanks to Glitch. Click the button below:

<!-- Remix Button -->
<a href="https://glitch.com/edit/#!/remix/zero-starter">
  <img src="https://cdn.glitch.com/2bdfb3f8-05ef-4035-a06e-2043962a3a13%2Fremix%402x.png?1513093958726" alt="remix this" height="30" />
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

You just created an API endpoint 🎉

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

Now go to this URL: `http://localhost:3000/` and you should see the current server time rendered by React while `fetch`-ing an API endpoint you created earlier.

`zero` automatically bundles your code and supports server-side rendering. You don't need to fiddle with webpack anymore.

That's it! You just created a web application.

## Supported Languages

- Node.js _(JavaScript & TypeScript)_
- React _(JavaScript & TypeScript)_
- HTML
- Markdown / MDX
- Vue
- Svelte
- Python
