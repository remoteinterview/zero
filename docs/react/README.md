# React

Zero can bundle and render React. Zero treats each `.jsx` file in your project folder as a separate page.

If your component resides in `./about.jsx` file, it's exposed at `http://<SERVER>/about`. Inspired by good ol' PHP days.

Example
```jsx
// about.jsx
export default ()=>(
  <h1>About</h1>
)
```

The above code exports a Stateless React component with `h1` heading.