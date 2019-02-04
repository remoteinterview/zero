const path = require("path")
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const IS_DEV = (process.env.NODE_ENV !== 'production');
const babelConfig = require("./babel.config")
const babelLoader = {loader: 'babel-loader', options: babelConfig}

// Support for NODE_PATH
const nodePathList = (process.env.NODE_PATH || '').split(process.platform === 'win32' ? ';' : ':').filter((p) => !!p)

module.exports = {
  mode: IS_DEV ? "development" : "production",
  resolveLoader: {
    //modules: [path.join(__dirname, "../node_modules"), ...nodePathList]
    modules: [path.join(__dirname, "webpack-loaders")]
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      //filename: IS_DEV ? '[name].css' : '[name].[hash].css',
      filename: "bundle.css"
      //chunkFilename: IS_DEV ? '[id].css' : '[id].[hash].css',
    })
  ],
  module: {
    rules: [
      // BABEL
      {
        test: /\.(js|jsx)$/,
        resolve: {
          extensions: [".js", ".jsx"]
        },
        use: [
          babelLoader
        ],
        exclude: /(node_modules)/,
      },

      // STYLES
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: IS_DEV
            }
          },
        ]
      },

      // CSS / SASS
      {
        test: /\.scss/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: IS_DEV
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: IS_DEV
            }
          }
        ]
      },

      // IMAGES
      {
        test: /\.(jpe?g|png|gif)$/,
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]'
        }
      },

      // MARKDOWN
      {
        test: /\.(md|mdx)$/,
        use: [
          babelLoader, 
          'mdx-js-loader']
      }
    ]
  }
};