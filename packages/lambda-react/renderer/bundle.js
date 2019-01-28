const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const babel = require('babel-core')
const browserify = require('browserify')
const { minify } = require('uglify-es')
//const Bundler = require('parcel-bundler');
var sassify = require('sassify');

const crypto = require("crypto");
function sha1(data) {
    return crypto.createHash("sha1").update(data, "binary").digest("hex");
}

const parse = (filename, raw) => babel.transform(raw, {
  filename,
  presets: [
    require('babel-preset-env'),
    require('babel-preset-stage-0'),
    require('babel-preset-react')
  ],
  /*plugins: [
    [
      require("babel-plugin-transform-runtime"),
      {
        "corejs": false,
        "helpers": true,
        "regenerator": true,
        "useESModules": false
      }
    ]
  ],*/
  compact: true,
  minified: true,
  comments: false,
}).code

const browser = (filename, code) => {
  const stream = new Readable
  stream.push(code)
  stream.push(null)
  const dirname = path.dirname(filename)

  return new Promise((resolve, reject) => {
    browserify(stream, {
      basedir: dirname
    })
    .transform("babelify", {
      presets: ["babel-preset-env", "babel-preset-stage-0", "babel-preset-react"],
      plugins: [
        [
          "babel-plugin-transform-runtime",
          {
            "corejs": false,
            "helpers": true,
            "regenerator": true,
            "useESModules": false
          }
        ]
      ]
    })
    .transform('browserify-css', { // first import all css cuz sassify crashes on some css files.
      autoInject: true,
      global: true,
      autoInjectOptions: {
        "insertAt": "bottom"
      }
    })
    .transform(sassify, {
      base64Encode: false, // Use base64 to inject css
      sourceMap: false, // Add source map to the code
      // when 'no-auto-inject' is set to `true`, `require('./style.scss')` won't inject styles
      // it will simply return the css as a string
      'no-auto-inject': false
    })
    .bundle((err, res) => {
      // console.log("bundle", err)
      if (err) reject(err)
      else {
        const script = res.toString()
        resolve(script)
      }
    })
  })
}


const bundle = async filename => {
  //process.env.NODE_ENV = 'production'
  const raw = fs.readFileSync(filename)
  const component = parse(filename, raw) // transform just the component file in browser friendly version
  const entry = createEntry(component) // wrap the component with entry and loader

  const script = await browser(filename, entry) // transform and pack all the imported packages and modules 
  const min = process.env.NODE_ENV==='production'?minify(script).code : script
  return {js: min }

  /*
  // save entry code in a file and feed it to parceljs
  var entryFileName = path.join(path.dirname(filename), "/"+ sha1(filename) + ".js")
  var outputFileName = sha1(filename) + ".out.js"
  var outputFileNameCss = sha1(filename) + ".out.css"
  fs.writeFileSync(entryFileName, entry, 'utf8')
  const bundler = new Bundler(entryFileName, {
    outDir: path.dirname(filename),
    outFile: outputFileName,
    sourceMaps: false,
    watch: false,
    cache: false
  })
  const bundle = await bundler.bundle()
  
  // remove temporary files and return output file
  fs.unlinkSync(entryFileName)
  var outputJS = fs.readFileSync(path.join(path.dirname(filename), outputFileName), 'utf8')
  fs.unlinkSync(path.join(path.dirname(filename), outputFileName))
  var outputCss = false
  if (fs.existsSync( path.join(path.dirname(filename), outputFileNameCss) ) ){
    outputCss = fs.readFileSync(path.join(path.dirname(filename), outputFileNameCss), 'utf8')
    fs.unlinkSync(path.join(path.dirname(filename), outputFileNameCss))
  }
  return {js: outputJS, css: outputCss}
  */
  
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
