const mdxTransform = require("@mdx-js/mdx").sync
const konan = require('konan')
const path = require("path")

module.exports = (file, code) => {
  if (path.extname(file)===".mdx" || path.extname(file)===".md"){
    code = mdxTransform(code)
  }
  return konan(code)
}