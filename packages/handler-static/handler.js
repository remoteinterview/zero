// const path = require("path");
// const url = require("url");
const express = require("express");

module.exports = (req, res) => {
  const staticMiddleware = express.static(process.env.SOURCEPATH, {
    dotfiles: "allow"
  });
  // const staticMiddlewareBuilds = express.static(path.join(process.env.BUILDPATH, ".zero"), {dotfiles: 'allow'});
  staticMiddleware(req, res, () => {
    res.sendStatus(404);
  });
};
