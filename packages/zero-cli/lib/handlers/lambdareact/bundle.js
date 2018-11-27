const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const babel = require('babel-core')
const browserify = require('browserify')
const { minify } = require('uglify-es')

const parse = (filename, raw) => babel.transform(raw, {
  filename,
  presets: [
    require('babel-preset-env'),
    require('babel-preset-stage-0'),
    require('babel-preset-react')
  ],
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
      //.transform("babelify", { presets: ["babel-preset-env", "babel-preset-stage-0", "babel-preset-react"] })
      .bundle((err, res) => {
        if (err) reject(err)
        else {
          const script = res.toString()
          resolve(script)
        }
      })
  })
}

const bundle = async filename => {
  process.env.NODE_ENV = 'production'
  const raw = fs.readFileSync(filename)
  const component = parse(filename, raw)
  const entry = createEntry(component)
  const script = await browser(filename, entry)
  //return script
  const min = minify(script).code
  return min
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
