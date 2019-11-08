module.exports = {
  bundler: require("./bundler"),
  getRelatedFiles: require("zero-dep-tree-js").getRelativeFiles,
  dependencies: {
    vue: "^2.6.10",
    "vue-hot-reload-api": "^2.3.3",
    "vue-meta": "^1.6.0",
    "vue-template-compiler": "^2.6.10",
    "@vue/component-compiler-utils": "^3.0.2"
  }
};
