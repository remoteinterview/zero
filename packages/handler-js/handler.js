const path = require("path");
const requireUncached = module => {
  // invalidate cache for HMR to work in dev mode
  if (process.env.NODE_ENV !== "production")
    delete require.cache[require.resolve(module)];
  return require(module);
};

module.exports = (req, res, pageData, buildInfo) => {
  if (!buildInfo || !buildInfo.js) return res.sendStatus(500);
  var func = requireUncached(path.join(process.env.SOURCEPATH, buildInfo.js));
  func = func && func.default ? func.default : func; // cater export default function...
  if (!func || typeof func !== "function") {
    console.log(
      `❓ Did you forget to export handler in ${path.basename(
        pageData.entryFile
      )}?`
    );
    return res.sendStatus(500);
  }
  func(req, res);
};
