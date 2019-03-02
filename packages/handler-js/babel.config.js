module.exports = {
  presets: [
      '@babel/preset-env',
      '@babel/preset-typescript'
    ].map(require.resolve),
  compact: true,
  extensions: ['.js', '.ts'],
  minified: process.env.NODE_ENV==="production",
  comments: false,
  // likely a bug in babel7, to make babel compile files outside of cwd, we need to add this ignore key
  // https://github.com/babel/babel/issues/8321#issuecomment-435389870
  ignore: [/node_modules/]
}
