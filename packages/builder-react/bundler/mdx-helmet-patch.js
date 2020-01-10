/*
MDX and React Helmet Async are incompatible because MDX changes the type
of each head-tags (title, meta, link etc) to MDXCreateElement type.
This causes helmet to throw.
We just hot-patch it to not throw on invalid tags.
 */

const fs = require("fs"),
  path = require("path");

function resolve(module) {
  return require.resolve(
    path.join(process.env.PROJECTPATH, "node_modules", module)
  );
}
function applyMod() {
  if (!global.reactHelmetModApplied) {
    global.reactHelmetModApplied = true;
    applyMDXMod();
    applyHelmetMod();
  }
}
function applyHelmetMod() {
  var files = ["lib/index.js", "lib/index.module.js"];
  files.forEach(file => {
    var fullPath = resolve(`react-helmet-async/${file}`);
    var content = fs.readFileSync(fullPath, "utf8");
    content = content.replace("r.warnOnInvalidChildren(e,i)", "false");
    content = content.replace("r.warnOnInvalidChildren(t,i)", "false");
    fs.writeFileSync(fullPath, content, "utf8");
  });
}

function applyMDXMod() {
  var files = [
    "dist/index.js",
    "dist/index.es.js",
    "dist/esm.js",
    "dist/cjs.js"
  ];
  files.forEach(file => {
    try {
      var fullPath = resolve(`@mdx-js/react/${file}`);
      var content = fs.readFileSync(fullPath, "utf8");
      content = content.replace(
        "if (typeof type === 'string' || mdxType)",
        `if ((typeof type === 'string' || mdxType) 
          && ["base", "body", "head", "html", "link", "meta", "noscript", "script", "style", "title", "Symbol(react.fragment)"].indexOf(type)===-1)`
      );
      fs.writeFileSync(fullPath, content, "utf8");
    } catch (e) {}
  });
}

module.exports = applyMod;
