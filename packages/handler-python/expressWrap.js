const express = require("express");
const fetch = require("node-fetch");

async function proxyRequest(port, req, res) {
  var pageAddress = "http://127.0.0.1:" + port;
  var options = {
    method: req.method,
    headers: Object.assign(
      { "x-forwarded-host": req.headers.host },
      req.headers
    ),
    compress: false,
    redirect: "manual"
    //credentials: "include"
  };
  if (
    req.method.toLowerCase() !== "get" &&
    req.method.toLowerCase() !== "head"
  ) {
    options.body = req;
  }
  var proxyRes;
  try {
    proxyRes = await fetch(pageAddress + req.url, options);
  } catch (e) {
    console.error(e);
    res.end();
    return;
  }

  // Forward status code
  res.statusCode = proxyRes.status;

  // Forward headers
  const headers = proxyRes.headers.raw();
  for (const key of Object.keys(headers)) {
    // if (key.toLowerCase() === "location" && headers[key]) {
    //   headers[key] = headers[key][0].replace(pageAddress, serverAddress);
    // }
    res.setHeader(key, headers[key]);
  }

  // Stream the proxy response
  proxyRes.body.pipe(res);
  proxyRes.body.on("error", err => {
    // console.error(`Error on proxying url: ${newUrl}`);
    console.error(err.stack);
    res.end();
  });

  req.on("abort", () => {
    proxyRes.body.destroy();
  });
}

module.exports = port => {
  const app = express();
  app.set("x-powered-by", false);
  app.all("*", (req, res) => {
    proxyRequest(port, req, res);
  });
  return app;
};
