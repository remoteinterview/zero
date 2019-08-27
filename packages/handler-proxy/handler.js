const expressWrap = require("./expressWrap");
const fs = require("fs");

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
    var json = JSON.parse(fs.readFileSync(entryFile, "utf8"));
    if (isModule) resolve(expressWrap(json));
    else {
      var app = expressWrap(json);
      var listener = app.listen(0, "127.0.0.1", () => {
        //debug("listening ", lambdaType, listener.address().port);
        if (process.send) process.send(listener.address().port);
        resolve(listener.address().port);
      });
    }
  });
};
