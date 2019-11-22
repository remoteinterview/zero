const path = require("path");

module.exports = file => {
  switch (path.extname(file)) {
    // check if js file is a js page function
    case ".js":
    case ".ts":
      return "page:js";

    // check if a react component
    // md/mdx is also rendered by react page
    case ".jsx":
    case ".tsx":
    case ".mdx":
    case ".md":
      return "page:react";

    case ".vue":
      return "page:vue";

    case ".svelte":
      return "page:svelte";

    // Python page
    case ".py":
      return "page:python";

    case ".html":
    case ".htm":
      return "page:html";

    case ".json":
      return "page:proxy";

    // catch all, static / cdn hosting
    default:
      return false;
  }
};
