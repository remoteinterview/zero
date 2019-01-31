const fs = require('fs')
const path = require('path')
const debug = require('debug')('react')
const babel = require('babel-core')
const webpack = require('webpack');
const mdxTransform = require("@mdx-js/mdx").sync
const webpackConfig = require("./webpack.config")
const babelConfig = require("./babel.config")
const crypto = require("crypto");
function sha1(data) {
    return crypto.createHash("sha1").update(data, "binary").digest("hex");
}

const parse = (filename, raw) => {
  if (path.extname(filename)===".mdx" || path.extname(filename)===".md"){
    raw = `import { MDXTag } from "@mdx-js/tag"; ${mdxTransform(raw)}`
  }

  return babel.transform(raw, {...babelConfig, filename}).code
}

const bundle = async (filename, bundlePath) => {
  
  const raw = fs.readFileSync(filename)
  const component = parse(filename, raw) // transform just the component file in browser friendly version
  const entry = createEntry(component) // wrap the component with entry and loader
  
  // save entry code in a file and feed it to webpack
  var entryFileName = path.join(path.dirname(filename), "/"+ sha1(filename) + ".js")
  fs.writeFileSync(entryFileName, entry, 'utf8')
  webpackConfig["entry"] = entryFileName
  webpackConfig["output"] = {
    path: bundlePath,
    filename: "bundle.js"
  }
  const {err, stats} = await webpackAsync(webpackConfig)
  fs.unlinkSync(entryFileName)
  return {err, stats}
}

function webpackAsync(config){
  return new Promise((resolve, reject)=>{
    webpack(config, (err, stats) => {
      debug("webpack stats", stats, err)
      if (err || stats.hasErrors()) {
        // Handle errors here
        resolve({err, stats})
      }
      else{
        resolve({stats})
      }
    });
  })
}
function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

// current doesn't handle async components
const createEntry = component => {
// store exported component in a variable so we can refer to it in following entry code.
// TODO: resolve this in a non-hacky way.
//console.log(component)
component = "var ZeroAppContainer;" + replaceAll(component, "module.exports", "ZeroAppContainer")
component = replaceAll(component, "exports.default", "ZeroAppContainer")
return(`
require("babel-polyfill");
var React = require("react")
${component}
const { hydrate } = require('react-dom')


const props = JSON.parse(
  initial_props.innerHTML
)
const el = React.createElement(ZeroAppContainer, props)
hydrate(el, document.getElementById("_react_root"))
`)
}

module.exports = bundle
