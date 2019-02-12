//const mkdirp = require('mkdirp')
const path = require('path')
//const bundle = require('./bundle')
const fs = require('fs')
const which = require('which')
const pythonExists = which.sync('python', {nothrow: true})


module.exports = async (req, res, file, bundlePath)=>{
  if (!pythonExists) throw new Error("No 'python' found in the PATH.")
  res.send('Python handler is coming soon.')
}
