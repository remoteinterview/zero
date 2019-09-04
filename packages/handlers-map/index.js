const handlers = {
  static: require("zero-static"),
  "lambda:html": require("zero-handler-html"),
  "lambda:js": require("zero-handler-js"),
  "lambda:react": require("zero-handler-react"),
  "lambda:vue": require("zero-handler-vue"),
  "lambda:python": require("zero-handler-python"),
  "lambda:proxy": require("zero-handler-proxy")
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
