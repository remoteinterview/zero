const path = require("path");
module.exports = async (req, res, file, bundlePath, basePath, bundleInfo) => {
  if (!bundleInfo || !bundleInfo.path) return res.sendStatus(500);
  res.sendFile(
    path.join(process.env.SOURCEPATH, bundleInfo.path, "index.html")
  );
};
