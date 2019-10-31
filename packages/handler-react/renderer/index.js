const localRequire = lib => {
  return require(require("path").join(
    process.env.SOURCEPATH,
    "/node_modules/",
    lib
  ));
};
const debug = require("debug")("react");
const path = require("path");

// we use client's react libraries to avoid two instances of React.
// this fixes react hooks: https://reactjs.org/warnings/invalid-hook-call-warning.html
const React = localRequire("react");
const { renderToString } = localRequire("react-dom/server");

// we use client's helmet instance to avoid two Helmet instances to be loaded.
// see: https://github.com/nfl/react-helmet/issues/125
// and https://stackoverflow.com/questions/45822925/react-helmet-outputting-empty-strings-on-server-side
const { Helmet, HelmetProvider } = localRequire("react-helmet-async");

const jsonStringify = require("json-stringify-safe");
var ssrCrashWarned = false;
const requireUncached = module => {
  // invalidate cache for HMR to work in dev mode
  if (process.env.NODE_ENV !== "production")
    delete require.cache[require.resolve(module)];
  return require(module);
};
async function generateComponent(
  req,
  res,
  componentPath,
  bundlePath,
  basePath,
  bundleInfo
) {
  try {
    var appPath = path.join(process.env.SOURCEPATH, bundleInfo.jsNode);
    var App = requireUncached(appPath);
  } catch (e) {
    if (!ssrCrashWarned) console.log(e);
  }
  res.header("Content-Type", "text/html");

  var meta = {},
    config = {};
  if (App) {
    meta = App.meta || {};
    config = App.config || {};
  }

  App = App && App.default ? App.default : App; // cater export default class...
  if (!App) {
    // component failed to load or was not exported.

    if (bundleInfo && bundleInfo.js) {
      // atleast we have a bundle. Disable SSR for this endpoint.
      if (!ssrCrashWarned)
        console.warn(
          `\n\n⚠️ SSR didn't work for ${basePath}. Some component might not be SSR compatible.`
        );
      ssrCrashWarned = true;
      var markup = `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8"/>
            ${
              bundleInfo.css
                ? `<link rel="stylesheet" href="/${bundleInfo.css}">`
                : ""
            }
          </head>
          <body>
            <div id="_react_root"></div>
            <script id='initial_props' type='application/json'>{}</script>
            <script src="/${bundleInfo.js}"></script>
          </body>
        </html>`;

      res.write(markup);
      res.end();
    } else {
      throw new Error(
        "Could not render this page. Did you forget to export? See logs for more info."
      );
    }
  } else {
    var props = {
      user: req.user,
      url: { query: req.query, params: req.params }
    };
    debug("App", typeof App.getInitialProps === "function");
    if (
      App &&
      App.getInitialProps &&
      typeof App.getInitialProps === "function"
    ) {
      try {
        var newProps = (await App.getInitialProps({ req, ...props })) || {};
        props = { ...props, ...newProps };
      } catch (e) {
        debug("ERROR::getInitialProps", e);
      }
    }

    const el = isAsync(App)
      ? await createAsyncElement(App, props)
      : React.createElement(App, props);

    const helmetContext = {};
    const helmetEl = React.createElement(
      HelmetProvider,
      { context: helmetContext },
      el
    );
    const html = renderToString(helmetEl);
    const { helmet } = helmetContext; //Helmet.renderStatic();

    // determine if the user has provided with <meta charset />,
    // if not, add a default tag with utf8
    var hasCharset = helmet.meta.toComponent().find(meta => {
      return meta.props && (meta.props["charSet"] || meta.props["charset"]);
    });
    const json = jsonStringify(props);
    const finalMetaTags = {
      title:
        helmet.title.toComponent()[0].props.children.length > 0
          ? helmet.title.toString()
          : meta.title
          ? `<title>${meta.title}</title>`
          : ""
    };
    var markup = `<!DOCTYPE html>
    <html ${helmet.htmlAttributes.toString()}>
      <head>
        ${!hasCharset ? '<meta charset="utf-8"/>' : ""}
        ${finalMetaTags.title}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        ${
          bundleInfo && bundleInfo.css
            ? `<link rel="stylesheet" href="/${bundleInfo.css}">`
            : ""
        }
      </head>
      <body ${helmet.bodyAttributes.toString()}>
        <div id="_react_root">${html}</div>
        ${
          !config.noBundling && bundleInfo && bundleInfo.js
            ? `<script id='initial_props' type='application/json'>${json}</script>
          <script src="/${bundleInfo.js}"></script>`
            : ""
        }
      </body>
    </html>`;

    res.write(markup);
    res.end();
  }
}

const isAsync = fn => fn.constructor.name === "AsyncFunction";

const createAsyncElement = async (Component, props) => await Component(props);

module.exports = generateComponent;
