// an express wrapper to run given handler
const path = require("path"),
  url = require("url"),
  Youch = require("youch"),
  YouchTerminal = require("youch-terminal"),
  express = require("express");
const FETCH = require("node-fetch");
const debug = require("debug")("core");

const GLOBALS = require("./globals");
const session = require("zero-express-session");

const vm = require("vm");

process.on("unhandledRejection", (reason, p) => {
  console.log(reason);
});

module.exports = async (handler, endpointData, buildInfo) => {
  try {
    buildInfo = JSON.parse(buildInfo);
  } catch (e) {}

  var app = await startServer(handler, endpointData, buildInfo);
  return app;
};

function generateFetch(req) {
  const serverAddress = process.env.SERVERADDRESS;
  return function fetch(uri, options) {
    // fix relative path when running on server side.
    if (uri && uri.indexOf("://") === -1) {
      // see if it's a path from root of server
      if (uri.startsWith("/")) {
        uri = url.resolve(serverAddress, uri);
      }
    }

    if (options && options.credentials && options.credentials === "include") {
      options.headers = req.headers;
    }
    debug("paths", req.originalUrl, req.baseUrl, req.path);
    debug("fetching", uri, options, serverAddress);
    return FETCH(uri, options);
  };
}

function startServer(handler, endpointData, buildInfo) {
  return new Promise((resolve, reject) => {
    const file = path.resolve(endpointData.entryFile);
    const app = express();

    app.disable("x-powered-by");

    // bootstrap express app with session
    session(app);

    app.use(require("body-parser").urlencoded({ extended: true }));
    app.use(require("body-parser").json());
    // change $path into express-style :path/
    const pathPattern = endpointData.path
      .split("/")
      .map(p => {
        if (p.startsWith("$")) return ":" + p.slice(1);
        return p;
      })
      .join("/");

    app.all(pathPattern, (req, res) => {
      try {
        var globals = Object.assign(
          {
            __Zero: {
              app,
              handler,
              endpointData,
              buildInfo,
              req,
              res,
              renderError,
              __DIRNAME: path.dirname(file),
              __FILENAME: file,
              fetch: generateFetch(req)
            }
          },
          GLOBALS
        );

        // we run the handler in it's own VM so we can inject some variables (__dirname and __filename) and global function (fetch()) to it.

        vm.runInNewContext(
          `
          const { app, handler, endpointData, buildInfo, req, res, fetch, renderError, __DIRNAME, __FILENAME } = __Zero;
          global.fetch = fetch
          global.app = app
          global.__DIRNAME = __DIRNAME
          global.__FILENAME = __FILENAME

          handler(req, res, endpointData, buildInfo)
          
        `,
          globals
        );
      } catch (error) {
        renderError(error, req, res);
      }
    });

    return resolve(app);
  });
}

async function renderError(error, req, res) {
  const youch = new Youch(error, req);

  // print error in terminal
  youch.toJSON().then(output => {
    console.log(YouchTerminal(output));
  });

  var html = await youch
    .addLink(({ message }) => {
      var style = `text-decoration: none; border: 1px solid #dcdcdc; padding: 9px 12px;`;
      const urlStack = `https://stackoverflow.com/search?q=${encodeURIComponent(
        `${message}`
      )}`;
      const urlGoogle = `https://www.google.com/search?q=${encodeURIComponent(
        `${message}`
      )}`;
      return `
    <a style="${style}" href="${urlGoogle}" target="_blank" title="Search on Google">Search Google</a>
    <a style="${style}" href="${urlStack}" target="_blank" title="Search on StackOverflow">Search StackOverflow</a>
    
    `;
    })
    .toHTML();
  try {
    res.writeHead(200, { "content-type": "text/html" });
    res.write(html);
    res.end();
  } catch (e) {
    // ignore
  }
}
