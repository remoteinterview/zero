// cache dns responses to avoid: https://github.com/nodejs/node/issues/21309
const dnscache = require("dnscache")({
  enable: true,
  ttl: 300,
  cachesize: 1000
});

const express = require("express");
const fetch = require("node-fetch");
var url = require("url");

const stripTrailingSlash = str => {
  return str.replace(/^(.+?)\/*?$/, "$1");
};

async function proxyRequest(proxyJson, req, res) {
  var urlObj = url.parse(proxyJson.url);
  req.headers.host = urlObj.host;
  var proxyFullUrl = proxyJson.url;
  if (!urlObj.path || urlObj.path === "/") {
    // concat given protocol://host:port with current path
    proxyFullUrl = `${urlObj.protocol}//${urlObj.host}${req.url}`;
  }
  var options = {
    method: req.method,
    headers: req.headers,
    compress: false,
    redirect: "manual"
  };
  if (
    req.method.toLowerCase() !== "get" &&
    req.method.toLowerCase() !== "head"
  ) {
    options.body = req;
  }
  var proxyRes;
  try {
    proxyRes = await fetch(proxyFullUrl, options);
  } catch (e) {
    console.log(e);
    return;
  }

  // Forward status code
  res.statusCode = proxyRes.status;

  // Forward headers
  const headers = proxyRes.headers.raw();
  for (const key of Object.keys(headers)) {
    res.setHeader(key, headers[key]);
  }

  // Stream the proxy response
  proxyRes.body.pipe(res);
  proxyRes.body.on("error", err => {
    console.error(err.stack);
    res.end();
  });

  req.on("abort", () => {
    proxyRes.body.destroy();
  });
}

module.exports = proxyJson => {
  const app = express();
  app.set("x-powered-by", false);
  app.all("*", (req, res) => {
    proxyRequest(proxyJson, req, res);
  });
  return app;
};
