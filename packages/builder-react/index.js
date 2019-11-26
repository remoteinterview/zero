const path = require("path");
module.exports = {
  bundler: require("./bundler"),
  getRelatedFiles: require("zero-dep-tree-js").getRelativeFiles,
  updateBabelConfig: currentBabelConfig => {
    // just check if config has already been added
    if (currentBabelConfig.plugins.indexOf("react-hot-loader/babel") === -1) {
      currentBabelConfig.plugins.unshift("react-hot-loader/babel");
    }

    if (
      currentBabelConfig.plugins.indexOf("babel-plugin-react-require") === -1
    ) {
      currentBabelConfig.plugins.unshift("babel-plugin-react-require");
    }

    return currentBabelConfig;
  },

  // custom deps needed by react bundler
  dependencies: file => {
    var ext = path.extname(file);
    var deps = {
      "@hot-loader/react-dom": "^16.8.1",
      "babel-plugin-react-require": "^3.1.1",
      react: "^16.11.0",
      "react-dom": "^16.11.0",
      "react-helmet-async": "^1.0.4",
      "react-hot-loader": "^4.12.15"
    };

    if (ext === ".md" || ext === ".mdx") {
      var depsMdx = {
        "@mdx-js/react": "^1.5.1",
        "@mdx-js/tag": "^0.20.3",
        "@mdx-js/mdx": "^1.5.1",
        "prism-react-renderer": "^1.0.2"
      };
      return { ...deps, ...depsMdx };
    }

    return deps;
  }
};
