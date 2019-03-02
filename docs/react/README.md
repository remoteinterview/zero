# React

Zero can bundle and render React. Zero treats each `.jsx` file in your project folder as a separate page.

If your component resides in `./about.jsx` file, it's exposed at `http://<SERVER>/about`. Inspired by good ol' PHP days.

## Quick Start

Create a file `index.jsx` in an empty folder and add the following code to it:

```jsx
// index.jsx
export default () => <h1>Hello React</h1>
```

The above code exports a stateless React component with `h1` heading.

You can now run `zero` command in this folder and open [`http://localhost:3000/`](http://localhost:3000) in the browser.

For each React page, zero does the following for you:
- Transpilation and bundling (with webpack and babel).
- Bundle CSS/SASS/SCSS.
- Server rendering, so you don't see blank page until JS loads.
- Inject session data into `this.props`.
- Automatic code splitting

## Fetching API Data
Loading data from API and then displaying it is a common task in any website. Zero provides a lifecycle hook to populate `props` of the page component.

To do this, export a `React.Component` class. Consider the example below which fetches user's messages and display the count:

```jsx
// inbox.jsx
export default class extends React.Component {
  static async getInitialProps({ req, user, url }) {
    var messages = await fetch("/api/messages")
                    .then((resp) => resp.json())
    return {messages: messages}
  }

  render() {
    return (
      <div>
        You have {this.props.messages.length} new messages.
      </div>
    )
  }
}
```

Notice that to load data, we use `getInitialProps` which is an async static method. It can asynchronously fetch anything that resolves to a JavaScript plain Object, which populates props. `getInitialProps` is inspired by Next.js.

This method runs on server end. Data returned from `getInitialProps` is serialized when server rendering. Make sure the returned object from getInitialProps is a plain Object and not using Date, Map or Set.

## Fetch API
[`fetch()`](https://developers.google.com/web/updates/2015/03/introduction-to-fetch) allows you to do network requests both in server-side code (like `getInitialProps`) and on client-side (like `componentDidMount`). `fetch()` works the same on both the server and client.

Should you want to make a `fetch` request with credentials such as cookies, you should set the `credentials` of the request to `"include"`.

```js
fetch(url, {
  credentials: 'include'
})
```


## Populating `<head>`
You should set the page's head tags (`<title>`, `<meta>`, etc.) for improved SEO. Zero has [React Helmet](https://github.com/nfl/react-helmet) set up for you to use in your React components like below:
```jsx
import {Helmet} from "react-helmet";

module.exports = () => (
  <div>
    <Helmet>
        <meta charset="UTF-8" />
        <title>Page Title</title>
        <link rel="canonical" href="http://mysite.com/example" />
    </Helmet>
    <h1>Hello World</h1>
  </div>
)
```

You can check all the supported tags [here](https://github.com/nfl/react-helmet#reference-guide).

## Importing CSS/Sass
Zero has built-in support for `.css` and `.scss` files. You can import a stylesheet by `import`-ing it in your component. Like below:

```jsx
// hello.jsx
import "./style.scss"
module.exports = ({name}) => (
  <h1>Hello {name}</h1>
)
```

Zero will automatically transpile all imported `.scss` files to CSS and bundle them into a single `.css` file.

## TypeScript
Zero supports React in TypeScript. Just use `.tsx` file extension with your TypeScript React page:

```tsx
import * as React from "react";

export default class HelloWorld extends React.Component<{}, {}> {
   render() {
      return (<b>Hello TypeScript</b>);
   }
}
```