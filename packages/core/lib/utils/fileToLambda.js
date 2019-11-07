const path = require("path");

module.exports = file => {
  switch (path.extname(file)) {
    // check if js file is a js lambda function
    case ".js":
    case ".ts":
      return "lambda:js";

    // check if a react component
    // md/mdx is also rendered by react lambda
    case ".jsx":
    case ".tsx":
    case ".mdx":
    case ".md":
      return "lambda:react";

    case ".vue":
      return "lambda:vue";

    // Python Lambda
    case ".py":
      return "lambda:python";

    case ".html":
    case ".htm":
      return "lambda:html";

    case ".json":
      return "lambda:proxy";

    // catch all, static / cdn hosting
    default:
      return false;
  }
};
