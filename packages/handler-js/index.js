module.exports = {
  process: require.resolve("./process.js"),
  bundler: require("./bundle"),
  getRelatedFiles: require("zero-dep-tree-js").getRelativeFiles
};
