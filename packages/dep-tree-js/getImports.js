const konan = require("konan");
const path = require("path");
const localRequire = lib => {
  return require(require("path").join(
    process.env.PROJECTPATH,
    "node_modules",
    lib
  ));
};

module.exports = (file, code) => {
  var extname = path.extname(file).toLowerCase();
  if (extname === ".mdx" || extname === ".md") {
    const mdxTransform = localRequire("@mdx-js/mdx").sync;
    code = mdxTransform(code);
  }

  if (extname === ".ts" || extname === ".tsx") {
    const ts = localRequire("typescript");
    var result = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.Preserve
      }
    });

    code = result.outputText;
  }

  if (extname === ".vue") {
    const vue = localRequire("@vue/component-compiler-utils");
    const vueTemplateCompiler = localRequire("vue-template-compiler");
    var p = vue.parse({
      source: code,
      needMap: false,
      compiler: vueTemplateCompiler
    });
    code = p && p.script ? p.script.content : "";
  }

  return konan(code);
};
