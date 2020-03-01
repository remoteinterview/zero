# Using Tailwind CSS with Zero
There are two steps to set up Tailwind CSS in your Zero project

## Add postcss.config.js
Add the following to `./postcss.config.js` in your project folder:
```js
const plugins = [
	require('tailwindcss'),
  require('autoprefixer')
]

module.exports = { plugins };
```

## Add Dependencies

Install the required packages, Zero will not be able to install these automatically:
```sh
yarn add tailwindcss autoprefixer postcss-modules
```

That's it, now you can use Tailwind CSS in your stylesheet, like:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

```