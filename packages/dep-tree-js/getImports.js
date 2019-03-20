const mdxTransform = require("@mdx-js/mdx").sync;
const konan = require("konan");
const path = require("path");
const ts = require("typescript");
const vue = require("@vue/component-compiler-utils");
const vueTemplateCompiler = require("vue-template-compiler");

module.exports = (file, code) => {
  var extname = path.extname(file).toLowerCase();
  if (extname === ".mdx" || extname === ".md") {
    code = mdxTransform(code);
  }

  if (extname === ".ts" || extname === ".tsx") {
    var result = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.Preserve
      }
    });

    code = result.outputText;
  }

  if (extname === ".vue") {
    var p = vue.parse({
      source: code,
      needMap: false,
      compiler: vueTemplateCompiler
    });
    code = p && p.script ? p.script.content : "";
  }

  return konan(code);
};
