# Zero Server

Zero is a web server to simplify web development.

With `zero`, you just write your business logic in a mix of Node.js files, React/HTML/MDX frontend pages and static files and `zero` will serve them. Zero abstracts the usual project configuration for routing, bundling, and transpiling to make it easier to get started.

## Features
**No Configuration Required**: Your project folder doesn't need any config files. You just place your code and it's automatically compiled, bundled and served.

**File-based Routing**: If your code resides in `./api/login.js` it's exposed at `http://<SERVER>/api/login`. Inspired by good ol' PHP days.

**Automatically Resolves Dependencies**: If a file does `require('underscore')`, it is automatically installed and resolved. You can always create your own `package.json` file to install a specific version of a package.

**Multiple Languages**: Zero is designed to support code written in many languages all under a single project. Imagine this:
1) Exposing your Tensorflow model as a python API.
2) Using React pages to consume it. 
3) Writing the user login code in Node.js. 
4) Your landing pages in a mix of HTML or Markdown/MDX.

All under a single project folder as a single web application.

**Improved Error Handling**: Each endpoints run in their own process. So if `/api/login` crashes for some reason, it doesn't affect `/chatroom` page or `/api/chat` API. Crashed endpoints are restarted automatically when the next user visits them.

## Installation

You can install `zero` globally by:

```sh
npm install -g zeroserver
```

## Getting Started

Let's start by making a website that tells us server time.

First we create an API endpoint in Node.js to tell us time in JSON.

Create a new folder and add a new file `time.js` in that folder. In this file, export a function that accepts `Request` and `Response` objects ([like Express](https://expressjs.com/en/4x/api.html#res)):

```js
// time.js
const moment = require("moment")

module.exports = (req, res) => {
	var time = moment().format('LT');   // 11:51 AM
	res.send({time: time })
}

```

Once saved, you can `cd` into that folder and start the server like this:

```sh
zero
```

Running this command will automatically install any dependencies (like *momentjs* here) and start the web server.

Open this URL in the browser: `http://localhost:3000/time`

You just created an API endpoint 🎉

Keep the server running. Now let's consume our API from a React page, create a new file `index.jsx` and add the following code:

```jsx
// index.jsx
export default class extends React.Component {
  static async getInitialProps(){
    var json = await fetch("/time").then((resp) => resp.json())
    return {time: json.time}
  }

  render() {
    return <p>Current time is: {this.props.time}</p>
  }
}
```

This is a standard React component. With one additional hook for initial data population:

`getInitialProps` is an `async` static method which is called by `zero` when the page loads. This method can return a plain object which populates props.

Now go to this URL: `http://localhost:3000/` and you should see the current server time rendered by React while `fetch`-ing an API endpoint you created earlier.

`zero` automatically bundles your code and supports server-side rendering. You don't need to fiddle with webpack anymore.

That's it! You just created a web application.

## Running on Cloud
*TODO*

## Supported Languages
- Node.js
- React
- Markdown / MDX
- Python *(soon)*


## Contributing, License, Examples
*TODO*