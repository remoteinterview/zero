const path = require("path");
module.exports = (req, res, file, bundlePath, basePath, bundleInfo) => {
  if (!bundleInfo || !bundleInfo.js) return res.sendStatus(500);
  var func = require(path.join(process.env.BUILDPATH, bundleInfo.js));
  func = func && func.default ? func.default : func; // cater export default function...
  if (!func || typeof func !== "function") {
    console.log(
      `❓ Did you forget to export handler in ${path.basename(file)}?`
    );
    return res.sendStatus(500);
  }
  func(req, res);
};
