const expressWrap = require("./expressWrap");

module.exports = async (
  basePath,
  entryFile,
  lambdaType,
  serverAddress,
  BundlePath,
  BundleInfo,
  isModule
) => {
  return new Promise((resolve, reject) => {
    var json = require(entryFile);
    if (isModule) resolve(expressWrap(json.url));
    else {
      var app = expressWrap(json.url);
      var listener = app.listen(0, "127.0.0.1", () => {
        //debug("listening ", lambdaType, listener.address().port);
        if (process.send) process.send(listener.address().port);
        resolve(listener.address().port);
      });
    }
  });
};
