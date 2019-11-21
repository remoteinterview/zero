const handlers = {
  static: require("zero-static"),
  "page:html": require("zero-handler-html"),
  "page:js": require("zero-handler-js"),
  "page:react": require("zero-handler-react"),
  "page:vue": require("zero-handler-vue"),
  "page:python": require("zero-handler-python"),
  "page:proxy": require("zero-handler-proxy"),
  "page:svelte": require("zero-handler-svelte")
};
module.exports = {
  handlers,
  getHandler: type => {
    // load the module and return the actual handler function
    if (handlers[type]) {
      if (handlers[type].handler) return handlers[type].handler;
      return require(handlers[type].process);
    }
    return false;
  }
};
