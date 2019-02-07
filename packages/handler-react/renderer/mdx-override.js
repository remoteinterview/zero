// import { addHook as overrideRequire } from "pirates"
// import { sync as mdxTransform } from "@mdx-js/mdx"
// import { transform as babelTransform } from "babel-core"

const overrideRequire = require("pirates").addHook
const mdxTransform = require("@mdx-js/mdx").sync
const babelTransform = require("@babel/core").transform
const babelConfig = require("./babel.config")

const transform = (code, filename) => {
  let jsxWithMDXTags = mdxTransform(code)

  let jsx = `
    import { MDXTag } from "@mdx-js/tag"

    ${jsxWithMDXTags}
  `

  let result = babelTransform(jsx, {...babelConfig, filename})
  return result.code
}

overrideRequire(transform, { exts: [".mdx", ".md"] })