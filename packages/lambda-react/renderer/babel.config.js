module.exports = {
  presets: [
    'babel-preset-stage-0',
      'babel-preset-react',
      'babel-preset-env',
    ].map(require.resolve),
  plugins: ['babel-plugin-add-module-exports', 'babel-plugin-react-require'].map(require.resolve),
  compact: true,
  minified: process.env.NODE_ENV==="production",
  comments: false,
}
