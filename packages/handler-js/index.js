module.exports = {
  process: require.resolve("./process.js"),
  getRelatedFiles: require("zero-dep-tree-js").getRelativeFiles
}