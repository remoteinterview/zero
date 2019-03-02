const ISDEV = process.env.NODE_ENV!=="production"
var plugins = [
  '@babel/plugin-transform-runtime',
  'babel-plugin-react-require',
  [require.resolve("babel-plugin-module-resolver"), {
    "alias": {
      "react": require.resolve('react'),
      "react-dom": require.resolve('react-dom')
    }
  }]
]
if (ISDEV) plugins.push('react-hot-loader/babel')
module.exports = {
  presets: [
      '@babel/preset-env',
      '@babel/preset-react',
      '@babel/preset-typescript'
    ].map(require.resolve),
  plugins: plugins.map((pl)=> typeof pl==='string'?require.resolve(pl):pl),
  compact: true,
  minified: process.env.NODE_ENV==="production",
  comments: false,
  // likely a bug in babel7, to make babel compile files outside of cwd, we need to add this ignore key
  // https://github.com/babel/babel/issues/8321#issuecomment-435389870
  ignore: [/node_modules/]
}
