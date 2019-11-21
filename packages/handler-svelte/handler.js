const requireUncached = module => {
  // invalidate cache for HMR to work in dev mode
  if (process.env.NODE_ENV !== "production")
    delete require.cache[require.resolve(module)];
  return require(module);
};
function loadSvelteApp(entryfile) {
  const unregisterSvelte = require("svelte/register");
  const App = requireUncached(entryfile).default;
  unregisterSvelte();
  return App;
}

module.exports = (req, res, pageData, buildInfo) => {
  const App = loadSvelteApp(pageData.entryFile);
  let props = {
    user: req.user,
    url: { query: req.query, params: req.params }
  };
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
