require("@babel/polyfill")
const babelConfig = require("./babel.config")
require('@babel/register')(babelConfig)

module.exports = (req, res, file)=>{
  var func = require(file)
  func = (func && func.default)? func.default : func // cater export default function...
  func(req, res)
}
