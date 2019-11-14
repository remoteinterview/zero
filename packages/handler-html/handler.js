const path = require("path");
module.exports = async (req, res, endpointData, buildInfo) => {
  if (!buildInfo || !buildInfo.path) return res.sendStatus(500);
  res.sendFile(path.join(process.env.SOURCEPATH, buildInfo.path, "index.html"));
};
