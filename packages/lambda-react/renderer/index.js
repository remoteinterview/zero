//process.env.NODE_PATH = require("path").join(__dirname, "../node_modules")
require("babel-polyfill")
require('babel-register')({
  //options: {cwd: __dirname},
  presets: [
    'babel-preset-stage-0',
    'babel-preset-react',
    'babel-preset-env',
  ].map(require.resolve),
  plugins: ['babel-plugin-add-module-exports'].map(require.resolve)
})
require('ignore-styles') // ignore css/scss imports on server side.

const http = require('http')
const url = require('url')
const React = require('react')
const {
  renderToNodeStream,
  renderToStaticNodeStream,
  renderToString
} = require('react-dom/server')
const jsonStringify = require('json-stringify-safe')
const bundle = require('./bundle')
// const fetch = require('@zeit/fetch')()

// function ssrFetch(uri, options){
//   // fix relative path when running on server side.
//   if (uri && uri.startsWith("/")){
//     // TODO: figure out what happens when each lambda is running on multiple servers.
//     // TODO: figure out how to forward cookies (idea: run getInitialProps in a VM with modified global.fetch that has 'req' access and thus to cookies too)
//     uri = url.resolve("http://localhost:"+process.env.PORT, uri)
//   }
//   //console.log("fetch", uri)
//   return fetch(uri, options)
// }
// global.fetch = ssrFetch

var BUNDLECACHE = {}

async function generateComponent(req, res, componentPath){
  
  const App = require(componentPath)
  //var props = Object.assign({}, { req })
  var props = {user: req.user}
  if (App && App.getInitialProps && typeof App.getInitialProps === "function"){
    try{
      props = await App.getInitialProps({req, user: req.user}) || props
    }
    catch(e){
      console.log(e)
    }
  }
  
  // console.log("imported", App)
  //delete BUNDLECACHE[componentPath] // temp
  if (!BUNDLECACHE[componentPath]){
    BUNDLECACHE[componentPath] = await bundle(componentPath)
    console.log("bundle size", BUNDLECACHE[componentPath].js.length/1024)
  }


  const el = isAsync(App)
    ? await createAsyncElement(App, props)
    : React.createElement(App, props)

  
  const html = renderToString(el)
  if (BUNDLECACHE[componentPath].css){
    res.write(`<style>${BUNDLECACHE[componentPath].css}</style>`)
  }
  res.write('<div id="_react_root">')
  res.write(html)
  const json = jsonStringify(props)
  res.write(`<script id='initial_props' type='application/json'>${json}</script>`)
  res.write(`<script>${BUNDLECACHE[componentPath].js}</script>`)
  res.write('</div>')


  res.end()

/*
  const stream = renderToNodeStream(el)
  res.write('<div id="_react_root">')
  
  stream.pipe(res, { end: false })

  stream.on('error', error => {
    console.log("errorr", error)
    res.end()
  })
  
  stream.on('end', async () => {
    const json = jsonStringify(props)
    res.write(`<script id='initial_props' type='application/json'>${json}</script>`)
    res.write(`<script>${BUNDLECACHE[componentPath]}</script>`)
    res.write('</div>')
    res.end()
  })
*/
}


const isAsync = fn => fn.constructor.name === 'AsyncFunction'

const createAsyncElement = async (Component, props) =>
  await Component(props)

const header = `<!DOCTYPE html>
<meta charset='utf-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>`


module.exports = generateComponent