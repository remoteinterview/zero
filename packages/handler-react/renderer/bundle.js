const fs = require('fs')
const path = require('path')
const debug = require('debug')('react')
const babel = require('@babel/core')
const webpack = require('webpack');
const mdxTransform = require("@mdx-js/mdx").sync
const webpackConfig = require("./webpack.config")
const babelConfig = require("./babel.config")
const crypto = require("crypto");
const ISDEV = process.env.NODE_ENV!=="production"
const devServer = require("./dev-server")
function sha1(data) {
    return crypto.createHash("sha1").update(data, "binary").digest("hex");
}

const wrapInHotLoader = (filename) => {
  var comp = path.basename(filename)
  var entry = `var App = require('./${comp}');`
  entry += 'App = (App && App.default)?App.default : App;'
  // if (path.extname(filename)===".mdx" || path.extname(filename)===".md"){
  //   raw = `import { MDXTag } from "@mdx-js/tag"; ${mdxTransform(raw)}`
  // }

  // embed hot-reloader
  
  if (ISDEV) entry += `import { hot } from 'react-hot-loader/root'; App = hot(App);`

  entry += "module.exports = App"

  // need to transform hot-loader code
  return babel.transform(entry, {...babelConfig, filename}).code
}

const bundle = async (filename, bundlePath, basePath, publicBundlePath) => {
  // configure dynamic part of webpack config
  webpackConfig["output"] = {
    path: bundlePath,
    filename: "bundle.js",
    publicPath: "/"
    // hotUpdateChunkFilename: 'hot/hot-update.js',
    // hotUpdateMainFilename: 'hot/hot-update.json'
  }
  var entryFileName = path.join(path.dirname(filename), "/entry."+ sha1(filename) + ".js")
  webpackConfig["entry"] = [entryFileName]

  // run dev server and embed react-hot-loader if running locally.
  if (ISDEV){
    const hotLoaded = wrapInHotLoader(filename) // transform just the component file in browser friendly version
    var hotLoadedFileName = path.join(path.dirname(filename), "/hmr."+ sha1(filename) + ".js")
    fs.writeFileSync(hotLoadedFileName, hotLoaded, 'utf8')
    const entry = createEntry( path.basename(hotLoadedFileName) ) // wrap the component with entry
    
    // save entry code in a file and feed it to webpack
    fs.writeFileSync(entryFileName, entry, 'utf8')
    var {port, updateDevMiddleware} = await devServer()

    var devPath = `http://localhost:${port}/__webpack_hmr`
    
    if (ISDEV) webpackConfig['entry'].unshift(`${require.resolve('webpack-hot-middleware/client')}?path=${devPath}`)
    webpackConfig["output"]['publicPath'] = `http://localhost:${port}/`
    const {compiler, stats} = await webpackAsync(webpackConfig)
    if (ISDEV) updateDevMiddleware(compiler, webpackConfig)
    return {compiler, stats, webpackConfig}
  }
  else{
    const entry = createEntry( path.basename(filename) ) // wrap the component with entry 
    // save entry code in a file and feed it to webpack
    var entryFileName = path.join(path.dirname(filename), "/entry."+ sha1(filename) + ".js")
    fs.writeFileSync(entryFileName, entry, 'utf8')
    
    const {compiler, stats} = await webpackAsync(webpackConfig)
    return {compiler, stats, webpackConfig}
  }
}

function webpackAsync(config){
  return new Promise((resolve, reject)=>{
    var compiler = webpack(config, (err, stats) => {
      if (err) {
        return reject(err);
      }
      const info = stats.toJson();
      if (stats.hasErrors()) {
        return reject(new Error(info.errors));
      }
      if (stats.hasWarnings()) {
        console.warn(info.warnings);
      }
      resolve({compiler, stats})
    });
  })
}
function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

// current doesn't handle async components
const createEntry = componentPath => {
return(`
var React = require("react")
var App = require('./${componentPath}')
const { hydrate } = require('react-dom')


const props = JSON.parse(
  initial_props.innerHTML
)
const el = React.createElement(App, props)
hydrate(el, document.getElementById("_react_root"))
`)
}

module.exports = bundle
