const debug = require("debug")("vue");
const path = require("path");
const Vue = require("vue/dist/vue");
const VueMeta = require("vue-meta");
const renderer = require("vue-server-renderer").createRenderer();

Vue.use(VueMeta, {
  keyName: "head"
});

var ssrCrashWarned = false;

async function generateComponent(
  req,
  res,
  componentPath,
  bundlePath,
  basePath,
  bundleInfo
) {
  try {
    var App = require(path.join(process.env.BUILDPATH, bundleInfo.jsNode));
  } catch (e) {
    if (!ssrCrashWarned) console.log(e);
  }
  App = App && App.default ? App.default : App; // cater export default class...
  if (!App) {
    // component failed to load or was not exported.
    clientOnlyRender(req, res, bundleInfo, basePath);
  } else {
    // var props = {
    //   user: req.user,
    //   url: { query: req.query, params: req.params }
    // };

    try {
      const app = new Vue(App);
      const html = await renderer.renderToString(app);
      const {
        title,
        htmlAttrs,
        headAttrs,
        bodyAttrs,
        link,
        style,
        script,
        noscript,
        meta
      } = app.$meta().inject();
      var markup = `<!doctype html>
<html data-vue-meta-server-rendered ${htmlAttrs.text()}>
  <head ${headAttrs.text()}>
    ${meta.text()}
    ${title.text()}
    ${link.text()}
    ${style.text()}
    ${
      bundleInfo && bundleInfo.css
        ? `<link rel="stylesheet" href="/${bundleInfo.css}">`
        : ""
    }
    ${script.text()}
    ${noscript.text()}
  </head>
  <body ${bodyAttrs.text()}>
    <div id="__ZERO">${html}</div>
    
    ${script.text({ body: true })}
    ${
      bundleInfo && bundleInfo.js
        ? `<script src="/${bundleInfo.js}"></script>
            <script>window.__ZEROAPP.$mount('#__ZERO')</script>`
        : ""
    }
  </body>
</html>`;
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": Buffer.byteLength(markup)
      });
      res.end(markup);
    } catch (e) {
      if (!ssrCrashWarned) {
        console.log(e);
      }
      clientOnlyRender(req, res, bundleInfo, basePath);
    }
  }
}

function clientOnlyRender(req, res, bundleInfo, basePath) {
  if (bundleInfo && bundleInfo.js) {
    // atleast we have a bundle. Disable SSR for this endpoint.
    if (!ssrCrashWarned)
      console.warn(
        `\n\n⚠️ SSR didn't work for ${basePath}. Some component might not be SSR compatible.`
      );
    ssrCrashWarned = true;
    var markup = `<!doctype html>
<html>
<head>
  ${
    bundleInfo && bundleInfo.css
      ? `<link rel="stylesheet" href="/${bundleInfo.css}">`
      : ""
  }
</head>
<body>
  <div id="__ZERO"></div>
  ${
    bundleInfo && bundleInfo.js
      ? `<script src="/${bundleInfo.js}"></script>
          <script>window.__ZEROAPP.$mount('#__ZERO')</script>`
      : ""
  }
</body>
</html>`;

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": Buffer.byteLength(markup)
    });
    res.write(markup);
    res.end();
  } else {
    throw new Error(
      "Could not render this page. Did you forget to export? See logs for more info."
    );
  }
}

module.exports = generateComponent;
