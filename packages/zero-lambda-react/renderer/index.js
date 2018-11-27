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

const http = require('http')
const url = require('url')
const React = require('react')
const Youch = require('youch')
const {
  renderToNodeStream,
  renderToStaticNodeStream,
  renderToString
} = require('react-dom/server')
const jsonStringify = require('json-stringify-safe')
const bundle = require('./bundle')

global.fetch = require('@zeit/fetch')()

var BUNDLECACHE = {}

async function generateComponent(req, res, componentPath){
  try {
    const App = require(componentPath)
    const props = Object.assign({}, { req })

  
    if (!BUNDLECACHE[componentPath]){
      BUNDLECACHE[componentPath] = await bundle(componentPath)
      console.log("bundle size", BUNDLECACHE[componentPath].length/1024)
    }

  
    const el = isAsync(App)
      ? await createAsyncElement(App, props)
      : React.createElement(App, props)

    
    const html = renderToString(el)
    res.write('<div id="_react_root">')
    res.write(html)
    const json = jsonStringify(props)
    res.write(`<script id='initial_props' type='application/json'>${json}</script>`)
    res.write(`<script>${BUNDLECACHE[componentPath]}</script>`)
    res.write('</div>')
  }
  catch(error){
    //res.write("ERROR")
    console.log("e",error)
    const youch = new Youch(error, req)
    
    var html = await 
    youch.addLink(({ message }) => {
      var style = `text-decoration: none; border: 1px solid #dcdcdc; padding: 9px 12px;`
      const urlStack = `https://stackoverflow.com/search?q=${encodeURIComponent(`${message}`)}`
      const urlGoogle = `https://www.google.com/search?q=${encodeURIComponent(`${message}`)}`
      return `
      <a style="${style}" href="${urlGoogle}" target="_blank" title="Search on Google">Search Google</a>
      <a style="${style}" href="${urlStack}" target="_blank" title="Search on StackOverflow">Search StackOverflow</a>
      
      `
    }).toHTML()
    res.writeHead(200, {'content-type': 'text/html'})
    res.write(html)
    
  }

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