const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const IS_DEV = (process.env.NODE_ENV !== 'production');

module.exports = {
  context: process.env.BUILDPATH,
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
        loader: 'babel-loader',
        exclude: /(node_modules)/,
        options: {
          compact: true,
          presets: [
            'babel-preset-stage-0',
              'babel-preset-react',
              'babel-preset-env',
            ].map(require.resolve),
          plugins: ['babel-plugin-add-module-exports', 'babel-plugin-react-require'].map(require.resolve)
        }
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
        use: ['babel-loader', '@mdx-js/loader']
      }
    ]
  }
};