const express = require("express");
const fetch = require("node-fetch");

const stripTrailingSlash = str => {
  return str.replace(/^(.+?)\/*?$/, "$1");
};

async function proxyRequest(proxyUrl, req, res) {
  var lambdaAddress = stripTrailingSlash(proxyUrl);
  var options = {
    method: req.method,
    headers: Object.assign(
      { "x-forwarded-host": req.headers.host },
      req.headers
    ),
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
    proxyRes = await fetch(lambdaAddress + req.url, options);
  } catch (e) {}

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

module.exports = proxyUrl => {
  const app = express();
  app.set("x-powered-by", false);
  app.all("*", (req, res) => {
    proxyRequest(proxyUrl, req, res);
  });
  return app;
};
