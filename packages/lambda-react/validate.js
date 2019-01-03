#!/usr/bin/env node

// check if the given js/jsx file is a react component
// only exits normally if a valid react component is present in the given file.
// we are doing this in a separate process to avoid crashing main builder.

require('babel-register')({
  presets: [
    'babel-preset-react'
  ].map(require.resolve)
})

const React = require('react')
const {
  renderToString
} = require('react-dom/server')
const jsonStringify = require('json-stringify-safe')
const props = {}
const isAsync = fn => fn.constructor.name === 'AsyncFunction'
const createAsyncElement = async (Component, props) =>
  await Component(props)

// include the component
async function test(){
  var App = require( require("path").join(process.argv[2]) ) 
  try{
    const el = isAsync(App)
    ? await createAsyncElement(App, props)
    : React.createElement(App, props)
  }
  catch(e){
    throw e
  }
  if (renderToString(el)){
    console.log("Valid React component")
  }
  else{
    throw new Error("Empty component")
  }
}

try{
  test()
}
catch(e){
  throw e
}




