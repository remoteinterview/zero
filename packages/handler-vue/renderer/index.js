const localRequire = lib => {
  return require(require("path").join(
    process.env.SOURCEPATH,
    "node_modules",
    lib
  ));
};

const debug = require("debug")("vue");
const path = require("path");
const Vue = localRequire("vue/dist/vue");
const VueMeta = localRequire("vue-meta");
const renderer = require("vue-server-renderer").createRenderer();
const jsonStringify = require("json-stringify-safe");

Vue.use(VueMeta, {
  keyName: "head"
});

var ssrCrashWarned = false;
const requireUncached = module => {
  // invalidate cache for HMR to work in dev mode
  if (process.env.NODE_ENV !== "production")
    delete require.cache[require.resolve(module)];
  return require(module);
};
async function generateComponent(req, res, endpointData, buildInfo) {
  try {
    var App = requireUncached(
      path.join(process.env.SOURCEPATH, buildInfo.jsNode)
    );
  } catch (e) {
    if (!ssrCrashWarned) console.log(e);
  }
  App = App && App.default ? App.default : App; // cater export default class...
  if (!App) {
    // component failed to load or was not exported.
    clientOnlyRender(req, res, buildInfo, endpointData.path);
  } else {
    // load asyncData if function exposed
    var asyncData = {};
    var props = {
      user: req.user,
      url: { query: req.query, params: req.params }
    };
    if (App && App.asyncData && typeof App.asyncData === "function") {
      try {
        asyncData = (await App.asyncData({ req, ...props })) || {};
      } catch (e) {
        debug("ERROR::asyncData", e);
      }
    }

    // render the component
    try {
      // get component's data as we will be merging it with asyncData from above
      var appData = {};
      if (typeof App.data === "function") appData = App.data();
      else if (App.data) appData = App.data;
      const app = new Vue({ ...App, data: { ...appData, ...asyncData } });

      // render everything to string
      const html = await renderer.renderToString(app);
      const json = jsonStringify(asyncData);
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
      buildInfo && buildInfo.css
        ? `<link rel="stylesheet" href="/${buildInfo.css}">`
        : ""
    }
    ${script.text()}
    ${noscript.text()}
  </head>
  <body ${bodyAttrs.text()}>
    <div id="__ZERO">${html}</div>
    
    ${script.text({ body: true })}
    ${
      buildInfo && buildInfo.js
        ? `<script>window.__ZERO_ASYNCDATA=${json}</script><script src="/${
            buildInfo.js
          }"></script>`
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
      clientOnlyRender(req, res, buildInfo, endpointData.path);
    }
  }
}

function clientOnlyRender(req, res, buildInfo, basePath) {
  if (buildInfo && buildInfo.js) {
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
    buildInfo && buildInfo.css
      ? `<link rel="stylesheet" href="/${buildInfo.css}">`
      : ""
  }
</head>
<body>
  <div id="__ZERO"></div>
  ${
    buildInfo && buildInfo.js
      ? `<script src="/${buildInfo.js}"></script>
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
