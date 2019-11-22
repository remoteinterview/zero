const debug = require("debug")("svelte");

const requireUncached = module => {
  // invalidate cache for HMR to work in dev mode
  if (process.env.NODE_ENV !== "production")
    delete require.cache[require.resolve(module)];
  return require(module);
};
function loadSvelteApp(entryfile) {
  const unregisterSvelte = require("svelte/register");
  const Component = requireUncached(entryfile);
  unregisterSvelte();
  return { App: Component.default, preload: Component.preload };
}

module.exports = async (req, res, pageData, buildInfo) => {
  const { App, preload } = loadSvelteApp(pageData.entryFile);

  // load preload data if a function exposed
  var preloadData = {};
  let props = {
    user: req.user,
    url: { query: req.query, params: req.params }
  };

  // call preload() function if this page exposes one,
  // merge the returned object with props and pass merged props to svelte renderer
  if (preload && typeof preload === "function") {
    try {
      preloadData = (await preload({ req, ...props })) || {};
      props = { ...props, ...preloadData };
    } catch (e) {
      debug("ERROR::preload", e);
    }
  }
  const { head, html, css } = App.render(props);

  props = JSON.stringify(props);
  let layout = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  ${head}
  ${buildInfo.css ? `<link rel="stylesheet" href="/${buildInfo.css}">` : ""}
</head>
<body>
<div id="app">${html}</div>
<template id="props">${props}</template>
<script src="/${buildInfo.js}"></script>
</body>
</html>
  `;
  layout = layout.trim();
  res
    .status(200)
    .type("html")
    .end(layout);
};
