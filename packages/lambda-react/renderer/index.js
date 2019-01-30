require("babel-polyfill")
require('babel-register')({
  
  presets: [
    'babel-preset-stage-0',
    'babel-preset-react',
    'babel-preset-env',
  ].map(require.resolve),
  plugins: ['babel-plugin-add-module-exports'].map(require.resolve)
})
require('ignore-styles') // ignore css/scss imports on server side.
const debug = require('debug')('react')
const http = require('http')
const url = require('url')
const React = require('react')
const {
  renderToString
} = require('react-dom/server')

// we use client's helmet instance to avoid two Helmet instances to be loaded.
// see: https://github.com/nfl/react-helmet/issues/125
// and https://stackoverflow.com/questions/45822925/react-helmet-outputting-empty-strings-on-server-side
const {Helmet} = require( require('path').join(process.env.BUILDPATH, "/node_modules/react-helmet") )

const jsonStringify = require('json-stringify-safe')
const bundle = require('./bundle')

var BUNDLECACHE = {}

async function generateComponent(req, res, componentPath){
  
  var App = require(componentPath)
  App = (App && App.default)?App.default : App // cater export default class...
  var props = {user: req.user, url: {query: req.query}}
  debug("App", typeof App.getInitialProps === "function")
  if (App && App.getInitialProps && typeof App.getInitialProps === "function"){
    try{
      var newProps = await App.getInitialProps({req, ...props}) || {}
      props = {...props, ...newProps}
    }
    catch(e){
      debug("ERROR::getInitialProps", e)
    }
  }
  
  if (!BUNDLECACHE[componentPath]){
    BUNDLECACHE[componentPath] = await bundle(componentPath)
    debug("bundle size", BUNDLECACHE[componentPath].js.length/1024)
  }


  const el = isAsync(App)
    ? await createAsyncElement(App, props)
    : React.createElement(App, props)

  const html = renderToString(el)
  const helmet = Helmet.renderStatic()

  // determine if the user has provided with <meta charset />, 
  // if not, add a default tag with utf8
  var hasCharset = helmet.meta.toComponent().find((meta)=>{
    return meta.props && (meta.props['charSet'] || meta.props['charset'])
  })
  const json = jsonStringify(props)
  var markup = `<!DOCTYPE html>
  <html ${helmet.htmlAttributes.toString()}>
    <head>
      ${(!hasCharset?'<meta charset="utf-8"/>':'')}
      ${helmet.title.toString()}
      ${helmet.meta.toString()}
      ${helmet.link.toString()}
      ${(BUNDLECACHE[componentPath].css?`<style>${BUNDLECACHE[componentPath].css}</style>`:"")}
    </head>
    <body ${helmet.bodyAttributes.toString()}>
      <div id="_react_root">${html}</div>
      <script id='initial_props' type='application/json'>${json}</script>
      <script>${BUNDLECACHE[componentPath].js}</script>
    </body>
  </html>`

  res.write(markup)
  res.end()
}


const isAsync = fn => fn.constructor.name === 'AsyncFunction'

const createAsyncElement = async (Component, props) =>
  await Component(props)



// function wrapInHelmet(el){
//   var helmetEl = React.createElement(Helmet, {}, [
//     React.createElement("meta", {charset: "utf-8"})
//   ])

//   return React.createElement(React.Fragment, {}, [helmetEl, el])
// }

module.exports = generateComponent