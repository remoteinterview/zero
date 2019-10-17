const babelConfig = {
  plugins: [
    [require("react-hot-loader/babel")],
    [require("babel-plugin-transform-zero-dirname-filename")],
    [require("babel-plugin-react-require")],
    [require("@babel/plugin-transform-runtime")]
  ]
};

module.exports = () => babelConfig;
